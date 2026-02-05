const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Conversion = require('../models/Conversion'); 
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const stats = { offers: 0, responses: 0, users: 0, errors: [] };

  try {
    // Admin sees all
    if (req.user.role === 'admin') {
        try {
          stats.offers = await Campaign.countDocuments();
        } catch (e) {
          console.error('Campaign stats error:', e);
          stats.errors.push(`Campaigns: ${e.message}`);
        }

        try {
          stats.responses = await Conversion.countDocuments();
        } catch (e) {
          console.error('Conversion stats error:', e);
          stats.errors.push(`Conversions: ${e.message}`);
        }

        try {
          stats.users = await User.countDocuments();
        } catch (e) {
          console.error('User stats error:', e);
          stats.errors.push(`Users: ${e.message}`);
        }
    } else {
        // Non-admin sees only their own data
        console.log(`[Stats] User ${req.user.id} requesting own stats`);
        
        try {
            // My Campaigns
            const myCampaigns = await Campaign.find({ createdBy: req.user.id }).select('campaignId');
            const myCampaignIds = myCampaigns.map(c => String(c.campaignId));
            
            stats.offers = myCampaigns.length;

            // My Conversions (Conversions belonging to my campaigns)
            if (myCampaignIds.length > 0) {
                 stats.responses = await Conversion.countDocuments({
                    camp_id: { $in: myCampaignIds }
                 });
            } else {
                stats.responses = 0;
            }

            stats.users = 1; // It's just me!
            
        } catch (e) {
            console.error('[Stats] User stats error:', e);
            stats.errors.push(`User Stats: ${e.message}`);
        }
    }

    res.json(stats);
  } catch (error) {
    console.error('Stats fatal error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

module.exports = router;
