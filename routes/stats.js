const express = require('express');
// Force update
const router = express.Router();
const Campaign = require('../models/Campaign');
const Conversion = require('../models/Conversion'); 
const User = require('../models/User');

router.get('/', async (req, res) => {
  const stats = { offers: 0, responses: 0, users: 0, errors: [] };

  try {
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

    res.json(stats);
  } catch (error) {
    console.error('Stats fatal error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

module.exports = router;
