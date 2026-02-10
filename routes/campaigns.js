const express = require('express');
const router = express.Router();
const { getAllCampaigns, createCampaign, updateCampaign, deleteCampaign } = require('../utils/campaignStore');

const auth = require('../middleware/auth');

// Get all campaigns
router.get('/', auth, async (req, res) => {
  try {
    // We need to modify getAllCampaigns to accept a filter or just allow finding by user
    // Since getAllCampaigns is in utils/campaignStore.js and does `Campaign.find()`, 
    // we should validly filter here.
    // However, the `getAllCampaigns` function currently returns ALL. 
    // Let's modify the utils function OR just do the query here for simplicity since we have the model.
    const Campaign = require('../models/Campaign');
    const campaigns = await Campaign.find({ created_by: req.user.id }).sort({ campaignId: -1 });
    
    const formatted = campaigns.map(c => ({
        ...c.toObject(),
        id: c.campaignId
    }));
    
    res.json(formatted);
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

    // Add user ownership
    campaignData.created_by = req.user.id;

    const newCampaign = await createCampaign(campaignData);
    res.status(201).json(newCampaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
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

const checkRole = require('../middleware/checkRole');

// Delete campaign
router.delete('/:id', auth, checkRole(['superadmin']), async (req, res) => {
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
