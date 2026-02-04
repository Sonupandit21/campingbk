const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Conversion = require('../models/Conversion'); 
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const campaignsCount = await Campaign.countDocuments();
    const conversionsCount = await Conversion.countDocuments();
    const usersCount = await User.countDocuments();

    res.json({
      offers: campaignsCount,
      responses: conversionsCount,
      users: usersCount
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
