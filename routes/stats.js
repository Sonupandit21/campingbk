const express = require('express');
// Force update
const router = express.Router();
const Campaign = require('../models/Campaign');
const Conversion = require('../models/Conversion'); 
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
  const stats = { offers: 0, responses: 0, users: 0, errors: [] };
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    try {
      // Offers: Count campaigns assigned to this user
      // If admin, maybe show all? The requirement says "Assign Publisher", so maybe even admins see assigned ones or all.
      // For now let's assume Admin sees ALL, user sees assigned.
      // But requirement specifically says "Dashboard ... fresh state ... Offers -> 0". 
      // If I am a new user, I am NOT admin (default role='user'). So I should see 0.
      
      const campaignFilter = isAdmin ? {} : { assignedPublishers: userId };
      stats.offers = await Campaign.countDocuments(campaignFilter);
    } catch (e) {
      console.error('Campaign stats error:', e);
      stats.errors.push(`Campaigns: ${e.message}`);
    }

    try {
      // Responses: Conversions for this user
      const conversionFilter = isAdmin ? {} : { publisher_id: userId };
      stats.responses = await Conversion.countDocuments(conversionFilter);
    } catch (e) {
      console.error('Conversion stats error:', e);
      stats.errors.push(`Conversions: ${e.message}`);
    }

    try {
      // Users: 
      if (isAdmin) {
         stats.users = await User.countDocuments();
      } else {
         stats.users = 1; // Just the current user
      }
    } catch (e) {
      console.error('User stats error:', e);
      stats.errors.push(`Users: ${e.message}`);
    }

    res.json(stats);
  } catch (error) {
    console.error('Stats fatal error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

module.exports = router;
