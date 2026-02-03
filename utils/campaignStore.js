const Campaign = require('../models/Campaign');
const mongoose = require('mongoose');

// Get all campaigns
async function getAllCampaigns() {
  const campaigns = await Campaign.find().sort({ createdAt: -1 });
  return campaigns.map(c => ({
    ...c.toObject(),
    id: c._id.toString() // Ensure id is available
  }));
}

// Create new campaign
async function createCampaign(campaignData) {
  const campaign = new Campaign(campaignData);
  await campaign.save();
  return {
    ...campaign.toObject(),
    id: campaign._id.toString()
  };
}

// Update campaign
async function updateCampaign(id, campaignData) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid Campaign ID');
  }
  const campaign = await Campaign.findByIdAndUpdate(id, campaignData, { new: true });
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  return {
    ...campaign.toObject(),
    id: campaign._id.toString()
  };
}

// Delete campaign
async function deleteCampaign(id) {
  await Campaign.findByIdAndDelete(id);
  // Return empty array or filtered list if expected, existing returned new list
  // The existing logic returned the new list of campaigns.
  // To match that contract:
  return await getAllCampaigns();
}

module.exports = {
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign
};
