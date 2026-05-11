const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Campaign = require('../models/Campaign');

// POST Approve publisher for a campaign
router.post('/campaigns/:campaignId/approve/:publisherId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { campaignId, publisherId } = req.params;
    
    const campaign = await Campaign.findOne({ campaignId: Number(campaignId) });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const approval = campaign.publisherApprovals.find(
      a => a.publisher && a.publisher.toString() === publisherId
    );

    if (!approval) {
      // If no request exists, we create one as approved
      campaign.publisherApprovals.push({
        publisher: publisherId,
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      });
    } else {
      approval.status = 'approved';
      approval.approvedBy = req.user.id;
      approval.approvedAt = new Date();
    }

    await campaign.save();
    res.json({ success: true, message: 'Publisher approved' });
  } catch (error) {
    console.error('Approve publisher error:', error);
    res.status(500).json({ error: 'Failed to approve publisher' });
  }
});

// POST Reject publisher for a campaign
router.post('/campaigns/:campaignId/reject/:publisherId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { campaignId, publisherId } = req.params;
    
    const campaign = await Campaign.findOne({ campaignId: Number(campaignId) });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const approval = campaign.publisherApprovals.find(
      a => a.publisher && a.publisher.toString() === publisherId
    );

    if (!approval) {
        campaign.publisherApprovals.push({
            publisher: publisherId,
            status: 'rejected'
        });
    } else {
      approval.status = 'rejected';
    }

    await campaign.save();
    res.json({ success: true, message: 'Publisher rejected' });
  } catch (error) {
    console.error('Reject publisher error:', error);
    res.status(500).json({ error: 'Failed to reject publisher' });
  }
});

module.exports = router;
