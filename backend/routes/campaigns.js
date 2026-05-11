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
    let query = { created_by: req.user.id };
    
    if (req.user.role === 'superadmin') {
        query = {}; // All campaigns
    }

    const { publisher_id } = req.query;
    if (publisher_id) {
        // Filter campaigns where assignedPublishers contains the publisher_id
        // We check for both string and numeric matching if needed, but assignedPublishers is [String]
        query.assignedPublishers = { $in: [publisher_id.toString()] };
    }

    const campaigns = await Campaign.find(query).sort({ campaignId: -1 });
    
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

// GET all campaigns for publisher with approval status
router.get('/publisher/all-campaigns', auth, async (req, res) => {
  try {
    const Campaign = require('../models/Campaign');
    const Publisher = require('../models/Publisher');
    
    // Find the publisher to know who created them
    const publisher = await Publisher.findOne({ publisherId: req.user.id });
    
    let query = { status: 'Active' };
    if (publisher && publisher.created_by) {
        query.created_by = publisher.created_by;
    }
    
    // Fetch campaigns
    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });
    
    const formatted = campaigns.map(c => {
      const approval = c.publisherApprovals?.find(
        a => a.publisher && a.publisher.toString() === req.user.id
      );
      
      return {
        ...c.toObject(),
        id: c.campaignId,
        approvalStatus: approval ? approval.status : 'none',
        // Also check if the publisher is explicitly assigned (legacy compatibility)
        isAssigned: c.assignedPublishers?.includes(req.user.id)
      };
    });
    
    res.json(formatted);
  } catch (error) {
    console.error('Get publisher campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch publisher campaigns' });
  }
});

// POST request approval for a campaign
router.post('/:id/request-approval', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const Campaign = require('../models/Campaign');
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
    
    // Check if already requested
    const existingApproval = campaign.publisherApprovals?.find(
      a => a.publisher && a.publisher.toString() === req.user.id
    );
    
    if (existingApproval) {
      return res.status(400).json({ error: 'Approval already requested or decided' });
    }
    
    // Add pending approval
    campaign.publisherApprovals.push({
      publisher: req.user.id,
      status: 'pending'
    });
    
    await campaign.save();
    
    res.json({ success: true, message: 'Approval request submitted' });
  } catch (error) {
    console.error('Request approval error:', error);
    res.status(500).json({ error: 'Failed to submit approval request' });
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
    // Match either string ID or number ID or ObjectId for camp_id
    const campaignIdStr = campaign.campaignId ? String(campaign.campaignId) : campaign._id.toString();
    const campaignIdObj = campaign._id.toString();
    
    const statsQuery = { 
        camp_id: { $in: [campaignIdStr, campaignIdObj] } 
    };

    const clicksCount = await Click.countDocuments(statsQuery);

    // Unique Clicks (Unique IPs)
    const uniqueClicks = await Click.distinct('ip_address', statsQuery);
    const uniqueClicksCount = uniqueClicks.length;

    res.json({
      ...campaign.toObject(),
      id: campaign.campaignId, 
      clicks: clicksCount,
      unique_clicks: uniqueClicksCount
    });

  } catch (error) {
    console.error('Get campaign details error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign details' });
  }
});

// Get campaign cutoffs (sampling rules)
router.get('/:id/cutoffs', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const Campaign = require('../models/Campaign');
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

    res.json(campaign.sampling || []);
  } catch (error) {
    console.error('Get campaign cutoffs error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign cutoffs' });
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
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const campaignData = req.body;

    const Campaign = require('../models/Campaign');
    const mongoose = require('mongoose');
    let campaign;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isObjectId && !isNaN(id)) {
      campaign = await Campaign.findOne({ campaignId: Number(id) });
    } else if (isObjectId) {
      campaign = await Campaign.findById(id);
    }

    if (campaign && req.user.role !== 'superadmin' && req.user.role !== 'admin' && campaign.created_by && campaign.created_by.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized to update this campaign' });
    }
    
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
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Delete Campaign] Request to delete campaign ID: ${id} by user: ${req.user?.id}, role: ${req.user?.role}`);

    const Campaign = require('../models/Campaign');
    const mongoose = require('mongoose');
    let campaign;
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && isNaN(id);
    if (!isObjectId && !isNaN(id)) {
      campaign = await Campaign.findOne({ campaignId: Number(id) });
    } else if (isObjectId) {
      campaign = await Campaign.findById(id);
    }

    console.log(`[Delete Campaign] Campaign found: ${campaign ? 'Yes (ID: ' + campaign._id + ')' : 'No'}`);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Authorization check: only block if NOT superadmin/admin AND campaign has an owner AND it's a different user
    if (
      req.user.role !== 'superadmin' &&
      req.user.role !== 'admin' &&
      campaign.created_by &&
      campaign.created_by.toString() !== req.user.id
    ) {
        console.log(`[Delete Campaign] Unauthorized - campaign.created_by=${campaign.created_by}, user=${req.user.id}`);
        return res.status(403).json({ error: 'Unauthorized to delete this campaign' });
    }

    await deleteCampaign(id);
    console.log(`[Delete Campaign] Campaign ${id} deleted successfully`);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('[Delete Campaign] Error:', error);
    res.status(500).json({ error: 'Failed to delete campaign', details: error.message });
  }
});

module.exports = router;
module.exports = router;
