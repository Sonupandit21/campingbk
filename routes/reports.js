const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Click = require('../models/Click');
const Conversion = require('../models/Conversion');
const Campaign = require('../models/Campaign');
const Publisher = require('../models/Publisher');

router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, campaignId, publisherId } = req.query;
    console.log(`[Reports] Request: startDate=${startDate}, endDate=${endDate}, camp=${campaignId}, pub=${publisherId}`);

    // Base match criteria
    const match = {};
    if (startDate && startDate !== 'null' && startDate !== 'undefined') {
       match.timestamp = match.timestamp || {};
       match.timestamp.$gte = new Date(startDate);
    }
    
    if (endDate && endDate !== 'null' && endDate !== 'undefined') {
        match.timestamp = match.timestamp || {};
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.timestamp.$lte = end;
    }
    
    // Note: Click/Conversion models store IDs as Strings based on current schema
    if (campaignId && campaignId !== 'null' && campaignId !== 'undefined' && campaignId !== 'All Campaigns') {
        match.camp_id = campaignId;
    }

    if (publisherId && publisherId !== 'null' && publisherId !== 'undefined' && publisherId !== 'All Publishers') {
         match.publisher_id = publisherId;
    }

    console.log('[Reports] Match Query:', JSON.stringify(match, null, 2));

    // Define aggregation pipeline for Clicks
    const clickPipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            // Group by date (YYYY-MM-DD), campaign, and publisher
             date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
             camp_id: "$camp_id",
             publisher_id: "$publisher_id"
          },
          clicks: { $sum: 1 }
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
             publisher_id: "$publisher_id"
          },
          conversions: { $sum: 1 },
          payout: { $sum: "$payout" }
        }
      }
    ];

    // Run aggregations in parallel
    const [clickResults, conversionResults] = await Promise.all([
      Click.aggregate(clickPipeline),
      Conversion.aggregate(conversionPipeline)
    ]);

    // Merge results
    const reportMap = new Map();

    // Helper to generate key
    const getKey = (item) => `${item._id.date}|${item._id.camp_id}|${item._id.publisher_id}`;

    // Process clicks
    clickResults.forEach(item => {
      const key = getKey(item);
      if (!reportMap.has(key)) {
        reportMap.set(key, {
          date: item._id.date,
          camp_id: item._id.camp_id,
          publisher_id: item._id.publisher_id,
          clicks: 0,
          conversions: 0,
          payout: 0
        });
      }
      reportMap.get(key).clicks += item.clicks;
    });

    // Process conversions
    conversionResults.forEach(item => {
      const key = getKey(item);
      if (!reportMap.has(key)) {
        reportMap.set(key, {
            date: item._id.date,
            camp_id: item._id.camp_id,
            publisher_id: item._id.publisher_id,
            clicks: 0,
            conversions: 0,
            payout: 0
        });
      }
      const entry = reportMap.get(key);
      entry.conversions += item.conversions;
      entry.payout += item.payout;
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
    
    const campaigns = await Campaign.find({
        // Finding campaigns where campaignId matches
        // We might need to cast to Number if they are stored as numbers
         campaignId: { $in: distinctCampIds } 
    }).select('campaignId title');

    const publishers = await Publisher.find({
        publisherId: { $in: distinctPubIds }
    }).select('publisherId fullName');

    const campMap = {};
    campaigns.forEach(c => campMap[c.campaignId] = c.title);

    const pubMap = {};
    publishers.forEach(p => pubMap[p.publisherId] = p.fullName);

    // Finalize output
    const report = Array.from(reportMap.values()).map(row => ({
        ...row,
        campaignName: campMap[row.camp_id] || `Unknown (${row.camp_id})`,
        publisherName: pubMap[row.publisher_id] || `Unknown (${row.publisher_id})`,
        cr: row.clicks > 0 ? ((row.conversions / row.clicks) * 100).toFixed(2) : 0,
        epc: row.clicks > 0 ? (row.payout / row.clicks).toFixed(4) : 0
    }));

    // Sort by date desc
    report.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(report);

  } catch (error) {
    console.error('Reports Error:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

module.exports = router;
