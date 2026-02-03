const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Conversion = require('../models/Conversion'); // Make sure this path is correct based on where I created Conversion.js
const { getAllUsers } = require('../utils/userStore'); // Or use User model if available

router.get('/', async (req, res) => {
  try {
    const campaignsCount = await Campaign.countDocuments();
    const conversionsCount = await Conversion.countDocuments();
    
    // For users, if using helper:
    const users = await getAllUsers();
    const usersCount = users.length;

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
