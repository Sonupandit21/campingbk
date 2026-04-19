const express = require('express');
const router = express.Router();
const { getPostbackConfig, savePostbackConfig } = require('../utils/postbackStore');

// Get Global Postback URL
router.get('/', async (req, res) => {
  try {
    const config = await getPostbackConfig();
    res.json(config);
  } catch (error) {
    console.error('Get postback error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Save Global Postback URL
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    const config = await savePostbackConfig({ url });
    res.json({ message: 'Postback URL updated', config });
  } catch (error) {
    console.error('Save postback error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
