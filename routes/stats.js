const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Conversion = require('../models/Conversion'); 
const User = require('../models/User');

const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
  const stats = { offers: 0, responses: 0, users: 0, errors: [] };

  try {
    // Admin sees all data
    if (req.user.role === 'admin') {
        try {
          stats.offers = await Campaign.countDocuments();
        } catch (e) {
          stats.errors.push(`Campaigns: ${e.message}`);
        }

        try {
          stats.responses = await Conversion.countDocuments();
        } catch (e) {
          stats.errors.push(`Conversions: ${e.message}`);
        }

        try {
          stats.users = await User.countDocuments();
        } catch (e) {
          stats.errors.push(`Users: ${e.message}`);
        }
    } else {
        // Regular User sees restricted data (example: 0 or own data)
        // For now, returning 0 as requested to "fix" the visibility of global data
        stats.offers = 0; // Or count active campaigns available to them?
        stats.responses = 0; // Or count their own conversions?
        stats.users = 0; // They shouldn't see user count
    }

    res.json(stats);
  } catch (error) {
    console.error('Stats fatal error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

module.exports = router;
