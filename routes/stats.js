const express = require('express');
// Force update
const router = express.Router();
const Campaign = require('../models/Campaign');
const Conversion = require('../models/Conversion'); 
const User = require('../models/User');

const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const stats = { offers: 0, responses: 0, users: 1, errors: [] }; // Default users to 1 (self)

  try {
    const userId = req.user.id;

    const isPublisher = req.user.role === 'publisher';
    const isSuperAdmin = req.user.role === 'superadmin';

    if (isSuperAdmin) {
        // SUPERADMIN STATS: Global across all users
        try {
            stats.offers = await Campaign.countDocuments({});
            stats.responses = await Conversion.countDocuments({});
            stats.users = await User.countDocuments({ role: { $ne: 'publisher' } }); // Count all admin/users
        } catch (e) {
            console.error('Superadmin stats error:', e);
            stats.errors.push(`Superadmin Global: ${e.message}`);
        }
    } else if (isPublisher) {
       // PUBLISHER STATS
       // Offers: Count of campaigns they have access to? 
       // Technically they have access to ALL active campaigns if not private. 
       // Or maybe just campaigns they have converted?
       // Requirement: "show only Sonu Kumar’s data and reports"
       // "Offers" usually means "Available Offers".
       // Let's assume they see all active campaigns for now, OR 0 if we don't have an "Available" concept.
       // But "Responses" (Conversions) MUST be theirs.
       
       stats.offers = await Campaign.countDocuments({ status: 'Active' }); // Or whatever status logic

       stats.responses = await Conversion.countDocuments({ publisher_id: userId.toString() });

       // Users?? Publisher doesn't have users.
       stats.users = 0; 

    } else {
        // ADMIN STATS
        try {
          stats.offers = await Campaign.countDocuments({ created_by: userId });
        } catch (e) {
          console.error('Campaign stats error:', e);
          stats.errors.push(`Campaigns: ${e.message}`);
        }

        try {
          // Find campaigns created by this user first
          const userCampaigns = await Campaign.find({ created_by: userId }).select('campaignId');
          // For string IDs compatibility (if stored as "1" vs 1), let's map both just in case or use what we have.
          // Assuming Conversion stores camp_id as String.
          const campaignIds = userCampaigns.map(c => c.campaignId.toString());
          
          if (campaignIds.length > 0) {
            stats.responses = await Conversion.countDocuments({ camp_id: { $in: campaignIds } });
          } else {
            stats.responses = 0;
          }
        } catch (e) {
          console.error('Conversion stats error:', e);
          stats.errors.push(`Conversions: ${e.message}`);
        }

        // For "Users", if it means managed users, we count them. 
        // If it's just the tenant themselves, we return 1 (already set default).
        // If we want to exact count of additional users created by this admin (if role based):
        try {
           // Check if schema has created_by for User (not yet added, but standard for sub-users)
           // For now, let's keep it as 1 or if we have sub-users logic:
           // stats.users = await User.countDocuments({ created_by: userId }) + 1;
           // Given the requirement "Users = 1", we just stick to 1 for now or 
           // if we want to validte:
           stats.users = 1; 
        } catch (e) {
          // ignore
        }
    }

    // --- TOP PERFORMERS ---
    let topPerformers = [];
    try {
        const topConversions = await Conversion.aggregate([
            { $group: { _id: "$camp_id", responses: { $sum: 1 } } },
            { $sort: { responses: -1 } },
            { $limit: 5 }
        ]);

        for (const item of topConversions) {
            const campaign = await Campaign.findOne({ campaignId: parseInt(item._id) }).populate('created_by', 'name');
            if (campaign) {
                topPerformers.push({
                    offerName: campaign.title,
                    createdBy: campaign.created_by?.name || 'Admin',
                    responses: item.responses
                });
            } else {
                // Fallback for string IDs or if numeric search fails
                const campaignStr = await Campaign.findOne({ campaignId: item._id }).populate('created_by', 'name');
                if (campaignStr) {
                    topPerformers.push({
                        offerName: campaignStr.title,
                        createdBy: campaignStr.created_by?.name || 'Admin',
                        responses: item.responses
                    });
                }
            }
        }
    } catch (e) {
        console.error('Top Performers error:', e);
        stats.errors.push(`Top Performers: ${e.message}`);
    }

    res.json({ ...stats, topPerformers });
  } catch (error) {
    console.error('Stats fatal error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

module.exports = router;
