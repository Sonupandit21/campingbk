const express = require('express');
const router = express.Router();
const Postback = require('../models/Postback');
const Publisher = require('../models/Publisher');
const Campaign = require('../models/Campaign');
const auth = require('../middleware/auth');

// Get all postbacks
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. SuperAdmin only.' });
    }
    const postbacks = await Postback.find().sort({ createdAt: -1 });
    
    // We want to include publisher and campaign names for the list page
    const publishers = await Publisher.find({}, 'publisherId fullName');
    const campaigns = await Campaign.find({}, 'campaignId title');
    
    const pubMap = {};
    publishers.forEach(p => pubMap[p.publisherId] = p.fullName);
    
    const campMap = { 'ALL': 'ALL' };
    campaigns.forEach(c => campMap[c.campaignId] = c.title);

    const formatted = postbacks.map(pb => ({
      ...pb.toObject(),
      id: pb.postbackId || pb._id,
      publisherName: pubMap[pb.publisher] || pb.publisher,
      campaignName: campMap[pb.campaign] || pb.campaign
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get postbacks error:', error);
    res.status(500).json({ error: 'Failed to fetch postbacks' });
  }
});

// Create postback
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. SuperAdmin only.' });
    }
    const postbackData = req.body;
    
    // Auto-increment logic
    const lastPostback = await Postback.findOne().sort({ postbackId: -1 });
    const nextId = lastPostback && lastPostback.postbackId ? lastPostback.postbackId + 1 : 1;
    
    const postback = new Postback({
      ...postbackData,
      postbackId: nextId
    });
    
    await postback.save();
    res.status(201).json(postback);
  } catch (error) {
    console.error('Create postback error:', error);
    res.status(500).json({ error: 'Failed to create postback' });
  }
});

// Get single postback
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. SuperAdmin only.' });
    }
    const { id } = req.params;
    let postback;
    if (!isNaN(id)) {
      postback = await Postback.findOne({ postbackId: Number(id) });
    } else {
      postback = await Postback.findById(id);
    }

    if (!postback) {
      return res.status(404).json({ error: 'Postback not found' });
    }
    res.json(postback);
  } catch (error) {
    console.error('Get postback details error:', error);
    res.status(500).json({ error: 'Failed to fetch postback details' });
  }
});

// Update postback
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. SuperAdmin only.' });
    }
    const { id } = req.params;
    const postbackData = req.body;

    let postback;
    if (!isNaN(id)) {
      postback = await Postback.findOneAndUpdate({ postbackId: Number(id) }, postbackData, { new: true });
    } else {
      postback = await Postback.findByIdAndUpdate(id, postbackData, { new: true });
    }

    if (!postback) {
      return res.status(404).json({ error: 'Postback not found' });
    }
    res.json(postback);
  } catch (error) {
    console.error('Update postback error:', error);
    res.status(500).json({ error: 'Failed to update postback' });
  }
});

// Toggle status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. SuperAdmin only.' });
    }
    const { id } = req.params;
    const { status } = req.body;

    let postback;
    if (!isNaN(id)) {
      postback = await Postback.findOneAndUpdate({ postbackId: Number(id) }, { status }, { new: true });
    } else {
      postback = await Postback.findByIdAndUpdate(id, { status }, { new: true });
    }

    if (!postback) {
      return res.status(404).json({ error: 'Postback not found' });
    }
    res.json(postback);
  } catch (error) {
    console.error('Toggle postback status error:', error);
    res.status(500).json({ error: 'Failed to toggle status' });
  }
});

// Delete postback
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. SuperAdmin only.' });
    }
    const { id } = req.params;

    if (!isNaN(id)) {
      await Postback.findOneAndDelete({ postbackId: Number(id) });
    } else {
      await Postback.findByIdAndDelete(id);
    }

    res.json({ message: 'Postback deleted successfully' });
  } catch (error) {
    console.error('Delete postback error:', error);
    res.status(500).json({ error: 'Failed to delete postback' });
  }
});

module.exports = router;
