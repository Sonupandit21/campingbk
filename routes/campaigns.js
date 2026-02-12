const express = require('express');
const router = express.Router();
const { getAllCampaigns, createCampaign, updateCampaign, deleteCampaign } = require('../utils/campaignStore');

const auth = require('../middleware/auth');

// Get all campaigns
router.get('/', auth, async (req, res) => {
  try {
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

// Get campaign details with stats
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const Campaign = require('../models/Campaign');
    const Click = require('../models/Click');
    const mongoose = require('mongoose');

    let campaign;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    if (!isObjectId && !isNaN(id)) {
      campaign = await Campaign.findOne({ campaignId: Number(id) });
    } else if (isObjectId) {
      campaign = await Campaign.findById(id);
    }

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Fetch Stats
    // 1. Total Clicks
    // Match either string ID or number ID or ObjectId for camp_id in Clicks (schema says String)
    // We should probably match loosely to be safe, but adhering to existing patterns:
    // Tracking uses `camp_id` as string usually.
    const campaignIdStr = campaign.campaignId ? String(campaign.campaignId) : campaign._id.toString();
    const campaignIdObj = campaign._id.toString();
    
    // Construct query to match how clicks are stored (likely string)
    const statsQuery = { 
        camp_id: { $in: [campaignIdStr, campaignIdObj] } 
    };

    const clicksCount = await Click.countDocuments(statsQuery);

    // 2. Unique Clicks (Unique IPs)
    const uniqueClicks = await Click.distinct('ip_address', statsQuery);
    const uniqueClicksCount = uniqueClicks.length;

    res.json({
      ...campaign.toObject(),
      id: campaign.campaignId, // maintain consistency
      clicks: clicksCount,
      unique_clicks: uniqueClicksCount
    });

  } catch (error) {
    console.error('Get campaign details error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign details' });
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
    
    // Check if sampling rules are being updated
    const isSamplingUpdate = campaignData.hasOwnProperty('sampling');
    
    const updatedCampaign = await updateCampaign(id, campaignData);
    
    // If sampling rules changed, reprocess existing conversions
    if (isSamplingUpdate) {
      try {
        const { reprocessConversions } = require('./reprocess');
        const Campaign = require('../models/Campaign');
        const mongoose = require('mongoose');
        
        // The 'id' parameter could be either campaignId (numeric) or MongoDB _id
        let campaign;
        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        
        if (!isObjectId && !isNaN(id)) {
          // Numeric ID -> Search by campaignId
          campaign = await Campaign.findOne({ campaignId: Number(id) });
        } else if (isObjectId) {
          // Mongo ID -> Search by _id
          campaign = await Campaign.findById(id);
        }
        
        if (campaign) {
          console.log(`[Sampling Update] Reprocessing conversions for campaign ${campaign.campaignId}`);
          await reprocessConversions(campaign.campaignId, campaign.sampling);
          console.log(`[Sampling Update] Reprocessing completed`);
        }
      } catch (reprocessError) {
        console.error('[Sampling Update] Reprocessing error:', reprocessError);
        // Don't fail the update if reprocessing fails
      }
    }
    
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
router.delete('/:id', async (req, res) => {
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
