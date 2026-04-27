const express = require('express');
const router = express.Router();
const { getPostbackConfig, savePostbackConfig } = require('../utils/postbackStore');
const auth = require('../middleware/auth');
const Publisher = require('../models/Publisher');

// Get Postback URL (Global for Admin, Personal for Publisher)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'publisher') {
      let publisher = await Publisher.findOne({ publisherId: req.user.id });
      
      // Fallback: search by email if ID lookup failed (more robust)
      if (!publisher && req.user.email) {
          publisher = await Publisher.findOne({ email: req.user.email });
      }

      if (publisher && !publisher.securityToken) {
          // Auto-generate for existing publishers who don't have one
          publisher.securityToken = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
          await publisher.save();
      }
      return res.json({ 
        url: publisher ? publisher.postbackUrl || '' : '',
        securityToken: publisher ? publisher.securityToken || '' : ''
      });
    }
    
    // Default to system-wide global postback for admins
    const config = await getPostbackConfig();
    res.json(config);
  } catch (error) {
    console.error('Get postback error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Generate/Regenerate Security Token
router.post('/generate-token', auth, async (req, res) => {
  try {
    const newToken = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

    if (req.user.role === 'publisher') {
      let publisher = await Publisher.findOne({ publisherId: req.user.id });
      if (!publisher && req.user.email) {
        publisher = await Publisher.findOne({ email: req.user.email });
      }

      if (!publisher) return res.status(404).json({ error: 'Publisher not found' });

      publisher.securityToken = newToken;
      await publisher.save();
      return res.json({ message: 'Token generated', securityToken: publisher.securityToken });
    }

    // Role is admin/superadmin/user
    const config = await getPostbackConfig();
    config.securityToken = newToken;
    await savePostbackConfig(config);
    
    res.json({ message: 'Global token generated', securityToken: config.securityToken });
  } catch (error) {
    console.error('Generate token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Save Postback URL
router.post('/', auth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (req.user.role === 'publisher') {
      const publisher = await Publisher.findOneAndUpdate(
        { publisherId: req.user.id },
        { postbackUrl: url },
        { new: true }
      );
      return res.json({ message: 'Postback URL updated', url: publisher.postbackUrl });
    }

    // Default to system-wide global postback for admins
    const config = await savePostbackConfig({ url });
    res.json({ message: 'Global Postback URL updated', config });
  } catch (error) {
    console.error('Save postback error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
