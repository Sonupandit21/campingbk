const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Click = require('../models/Click');
const Conversion = require('../models/Conversion');
const Campaign = require('../models/Campaign');
const Publisher = require('../models/Publisher');

const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, campaignId, publisherId } = req.query;
    const userId = req.user.id; 
    const isPublisher = req.user.role === 'publisher';

    const match = {};

    // Logic separation based on Role
    if (isPublisher) {
        // PUBLISHER VIEW
        // 1. Must filter by their OWN publisher identifier
        match.publisher_id = userId.toString(); 

        // 2. Can filter by specific campaign if requested
        if (campaignId) {
            match.camp_id = campaignId;
        }
        
        // 3. Ignore query `publisherId` or warn if different? 
        // We fundamentally force it to be their ID above.
    } else {
        // ADMIN/USER VIEW
        // Get user's campaigns to filter
        const userCampaigns = await Campaign.find({ created_by: userId }).select('campaignId');
        const userCampIds = userCampaigns.map(c => c.campaignId.toString());
        
        // If the user has no campaigns, return empty report immediately
        if (userCampIds.length === 0) {
            return res.json([]);
        }

        // STRICT FILTERING: Only match campaigns owned by user
        if (campaignId) {
            if (!userCampIds.includes(campaignId.toString())) {
                 return res.json([]); // Unauthorized access to campaign
            }
            match.camp_id = campaignId;
        } else {
            // Match ANY of the user's campaigns
            match.camp_id = { $in: userCampIds };
        }

        // Optional: Filter by specific publisher if Admin requests it
        if (publisherId) {
           match.publisher_id = publisherId;
        }
    }

    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.timestamp.$lte = end;
      }
    }

    // Define aggregation pipeline for Clicks
    const clickPipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            // Group by date (YYYY-MM-DD), campaign, and publisher
             date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
             camp_id: "$camp_id",
             publisher_id: "$publisher_id",
             source: "$source"
          },
          clicks: { $sum: 1 },
          uniqueIps: { $addToSet: "$ip_address" }
        }
      },
      {
        $project: {
            clicks: 1,
            unique_clicks: { $size: "$uniqueIps" }
        }
      }
    ];

    // Define aggregation pipeline for Conversions
    // Conversions rely on createdAt/updatedAt usually, let's assume createdAt for timestamp
    const conversionMatch = { ...match };
    if (match.timestamp) {
        conversionMatch.createdAt = match.timestamp;
        delete conversionMatch.timestamp;
    }

    const conversionPipeline = [
      { $match: conversionMatch },
      {
        $group: {
          _id: {
             date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
             camp_id: "$camp_id",
             publisher_id: "$publisher_id",
             source: "$source"
          },
          conversions: { 
            $sum: { 
                $cond: [{ $eq: ["$status", "approved"] }, 1, 0] 
            } 
          },
          gross_conversions: { $sum: 1 },
          sampled_conversions: { 
            $sum: { 
                $cond: [{ $eq: ["$originalStatus", "sampled"] }, 1, 0] 
            } 
          },
          payout: { 
            $sum: {
                $cond: [{ $eq: ["$status", "approved"] }, "$payout", 0]
            }
          }
        }
      }
    ];

    // Aggregation to get sampled clicks (clicks that led to sampled conversions)
    const sampledClicksPipeline = [
      { 
        $match: { 
          ...conversionMatch,
          originalStatus: 'sampled'
        } 
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            camp_id: "$camp_id",
            publisher_id: "$publisher_id",
            source: "$source"
          },
          sampled_clicks: { $sum: 1 }
        }
      }
    ];

    // Run aggregations in parallel
    const [clickResults, conversionResults, sampledClicksResults] = await Promise.all([
      Click.aggregate(clickPipeline),
      Conversion.aggregate(conversionPipeline),
      Conversion.aggregate(sampledClicksPipeline)
    ]);

    // Merge results
    const reportMap = new Map();

    // Helper to generate key
    const getKey = (item) => `${item._id.date}|${item._id.camp_id}|${item._id.publisher_id}|${item._id.source}`;

    // Process clicks
    clickResults.forEach(item => {
      const key = getKey(item);
      if (!reportMap.has(key)) {
        reportMap.set(key, {
          date: item._id.date,
          camp_id: item._id.camp_id,
          publisher_id: item._id.publisher_id,
          source: item._id.source || '',
          gross_clicks: 0,
          clicks: 0,
          unique_clicks: 0,
          sampled_clicks: 0,
          conversions: 0,
          gross_conversions: 0,
          sampled_conversions: 0,
          payout: 0
        });
      }
      const entry = reportMap.get(key);
      entry.gross_clicks += item.clicks;
      entry.clicks += item.clicks;
      entry.unique_clicks += item.unique_clicks;
    });

    // Process conversions
    conversionResults.forEach(item => {
      const key = getKey(item);
      if (!reportMap.has(key)) {
        reportMap.set(key, {
            date: item._id.date,
            camp_id: item._id.camp_id,
            publisher_id: item._id.publisher_id,
            source: item._id.source || '',
            gross_clicks: 0,
            clicks: 0,
            unique_clicks: 0,
            sampled_clicks: 0,
            conversions: 0,
            gross_conversions: 0,
            sampled_conversions: 0,
            payout: 0
        });
      }
      const entry = reportMap.get(key);
      entry.conversions += item.conversions;
      entry.gross_conversions += item.gross_conversions;
      entry.sampled_conversions += item.sampled_conversions;
      entry.payout += item.payout;
    });

    // Process sampled clicks
    sampledClicksResults.forEach(item => {
      const key = getKey(item);
      if (!reportMap.has(key)) {
        reportMap.set(key, {
            date: item._id.date,
            camp_id: item._id.camp_id,
            publisher_id: item._id.publisher_id,
            source: item._id.source || '',
            gross_clicks: 0,
            clicks: 0,
            unique_clicks: 0,
            sampled_clicks: 0,
            conversions: 0,
            gross_conversions: 0,
            sampled_conversions: 0,
            payout: 0
        });
      }
      const entry = reportMap.get(key);
      entry.sampled_clicks += item.sampled_clicks;
    });

    // Enrich with Campaign and Publisher names
    // Fetch all needed campaigns and publishers first to minimize DB calls
    // (Optimization: In a huge system, we'd use $lookup in aggregation, but here separate query is fine for now)
    const distinctCampIds = [...new Set([...clickResults, ...conversionResults].map(x => x._id.camp_id))];
    const distinctPubIds = [...new Set([...clickResults, ...conversionResults].map(x => x._id.publisher_id))];

    // We need to match string IDs to what's in DB. 
    // Campaign model has `campaignId` (Number) and `_id`. 
    // Clicks use `camp_id` as String.
    // Let's try to find by both just in case, or assume they match the scheme used elsewhere.
    // Based on previous contexts, `camp_id` in clicks seems to be the custom ID (e.g. "1").
    
    // Warning: If camp_id is stored as "1" in Click but 1 (Number) in Campaign, we need care.
    // Let's assume loosely typed matching or explicit casting.
    
    // Filter out non-numeric IDs to prevent CastError if campaignId is Number
    // Filter out non-numeric IDs to prevent CastError if campaignId is Number
    const numericCampIds = distinctCampIds
        .map(id => Number(id))
        .filter(id => !isNaN(id) && id !== 0); // Assuming 0 is not a valid campaign ID or we filter it out if we want
    
    const campaigns = await Campaign.find({
        campaignId: { $in: numericCampIds } 
    }).select('campaignId title defaultGoalName');

    const publishers = await Publisher.find({
        publisherId: { $in: distinctPubIds }
    }).select('publisherId fullName');

    const campMap = {};
    campaigns.forEach(c => campMap[c.campaignId] = { title: c.title, goalName: c.defaultGoalName });

    const pubMap = {};
    publishers.forEach(p => pubMap[p.publisherId] = p.fullName);

    // Finalize output
    const report = Array.from(reportMap.values()).map(row => {
        const camp = campMap[row.camp_id] || {};
        return {
            ...row,
            campaignName: camp.title || `Unknown (${row.camp_id})`,
            goalName: camp.goalName || 'N/A',
            publisherName: pubMap[row.publisher_id] || `Unknown (${row.publisher_id})`,
            cr: row.clicks > 0 ? ((row.conversions / row.clicks) * 100).toFixed(2) : 0,
            epc: row.clicks > 0 ? (row.payout / row.clicks).toFixed(4) : 0
        };
    });

    // Sort by date desc
    report.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(report);

  } catch (error) {
    console.error('Reports Error:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

module.exports = router;
