const Campaign = require('../models/Campaign');
const mongoose = require('mongoose');

// Get all campaigns
async function getAllCampaigns(filter = {}) {
  const campaigns = await Campaign.find(filter).sort({ campaignId: 1 });
  return campaigns.map(c => ({
    ...c.toObject(),
    id: c.campaignId || c._id.toString() // Prefer sequential ID
  }));
}

// Create new campaign
async function createCampaign(campaignData, user) {
  // Auto-increment logic
  const lastCampaign = await Campaign.findOne().sort({ campaignId: -1 });
  const nextId = lastCampaign && lastCampaign.campaignId ? lastCampaign.campaignId + 1 : 1;

  const campaign = new Campaign({
    ...campaignData,
    campaignId: nextId,
    createdBy: user?.id || null
  });

  await campaign.save();
  return {
    ...campaign.toObject(),
    id: campaign.campaignId
  };
}

// Update campaign
async function updateCampaign(id, campaignData) {
  let campaign;
  // Check if it looks like a valid ObjectId
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  
  if (!isObjectId && !isNaN(id)) {
      // Numeric ID -> Search by campaignId
      campaign = await Campaign.findOneAndUpdate({ campaignId: Number(id) }, campaignData, { new: true });
  } else if (isObjectId) {
      // Mongo ID -> Search by _id
      campaign = await Campaign.findByIdAndUpdate(id, campaignData, { new: true });
  } else {
      throw new Error('Invalid ID format');
  }

  if (!campaign) {
    throw new Error('Campaign not found');
  }
  return {
    ...campaign.toObject(),
    id: campaign.campaignId || campaign._id.toString()
  };
}

// Delete campaign
async function deleteCampaign(id) {
  if (!mongoose.Types.ObjectId.isValid(id) && !isNaN(id)) {
    // It's a numeric ID (campaignId)
    await Campaign.findOneAndDelete({ campaignId: Number(id) });
  } else {
    // It's likely a MongoDB _id
    await Campaign.findByIdAndDelete(id);
  }
  
  // Return distinct list logic is handled by caller or rely on next fetch
  // This helper usually returns list, let's keep it simple and just void
  return { message: 'Deleted' };
}

module.exports = {
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign
};
