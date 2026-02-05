const express = require('express');
const router = express.Router();
const { getAllCampaigns, createCampaign, updateCampaign, deleteCampaign } = require('../utils/campaignStore');
const auth = require('../middleware/auth');

// Get all campaigns
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') {
       filter.createdBy = req.user.id;
    }
    const campaigns = await getAllCampaigns(filter);
    res.json(campaigns);
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create campaign
router.post('/', auth, async (req, res) => {
  try {
    const campaignData = req.body;
    
    if (!campaignData.title || !campaignData.defaultUrl) {
        return res.status(400).json({ error: 'Title and Default URL are required' });
    }

    const newCampaign = await createCampaign(campaignData, req.user); // Pass user
    res.status(201).json(newCampaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const campaignData = req.body;
    const updatedCampaign = await updateCampaign(id, campaignData);
    res.json(updatedCampaign);
  } catch (error) {
    console.error('Update campaign error:', error.message);
    if (error.message === 'Invalid Campaign ID' || error.message === 'Campaign not found') {
        return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteCampaign(id);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

module.exports = router;
