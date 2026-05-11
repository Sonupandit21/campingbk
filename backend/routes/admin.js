const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Campaign = require('../models/Campaign');

// POST Approve publisher for a campaign
router.post('/campaigns/:campaignId/approve/:publisherId', auth, async (req, res) => {
  try {
    const { campaignId, publisherId } = req.params;
    console.log(`Approving Campaign: ${campaignId}, Publisher: ${publisherId}`);

    if (req.user.role === 'publisher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const campaign = await Campaign.findOne({ campaignId: Number(campaignId) });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (!campaign.publisherApprovals) campaign.publisherApprovals = [];
    if (!campaign.assignedPublishers) campaign.assignedPublishers = [];

    // Update or create approval record
    let found = false;
    campaign.publisherApprovals.forEach(a => {
      if (a.publisher && a.publisher.toString() === publisherId.toString()) {
        a.status = 'approved';
        a.approvedBy = req.user.id;
        a.approvedAt = new Date();
        found = true;
      }
    });

    if (!found) {
      campaign.publisherApprovals.push({
        publisher: publisherId,
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      });
    }

    // Also add to assignedPublishers for double insurance and legacy compatibility
    if (!campaign.assignedPublishers.includes(publisherId.toString())) {
      campaign.assignedPublishers.push(publisherId.toString());
    }

    campaign.markModified('publisherApprovals');
    campaign.markModified('assignedPublishers');
    
    await campaign.save();
    res.json({ success: true, message: 'Publisher approved' });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve: ' + error.message });
  }
});

// POST Reject publisher for a campaign
router.post('/campaigns/:campaignId/reject/:publisherId', auth, async (req, res) => {
  try {
    const { campaignId, publisherId } = req.params;
    
    if (req.user.role === 'publisher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const campaign = await Campaign.findOne({ campaignId: Number(campaignId) });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (!campaign.publisherApprovals) campaign.publisherApprovals = [];
    
    let found = false;
    campaign.publisherApprovals.forEach(a => {
      if (a.publisher && a.publisher.toString() === publisherId.toString()) {
        a.status = 'rejected';
        found = true;
      }
    });

    if (!found) {
      campaign.publisherApprovals.push({
        publisher: publisherId,
        status: 'rejected'
      });
    }

    // Remove from assignedPublishers if rejected
    campaign.assignedPublishers = campaign.assignedPublishers.filter(id => id.toString() !== publisherId.toString());

    campaign.markModified('publisherApprovals');
    campaign.markModified('assignedPublishers');
    await campaign.save();
    res.json({ success: true, message: 'Publisher rejected' });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: 'Failed to reject: ' + error.message });
  }
});

module.exports = router;
