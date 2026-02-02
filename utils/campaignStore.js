const fs = require('fs').promises;
const path = require('path');

const CAMPAIGNS_FILE = path.join(__dirname, '../data/campaigns.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(CAMPAIGNS_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }
}

// Read campaigns from file
async function readCampaigns() {
  try {
    const data = await fs.readFile(CAMPAIGNS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // File doesn't exist yet
    return [];
  }
}

async function getAllCampaigns() {
  return await readCampaigns();
}

// Write campaigns to file
async function writeCampaigns(campaigns) {
  await ensureDataDir();
  await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
}

// Create new campaign
async function createCampaign(campaignData) {
  const campaigns = await readCampaigns();
  
  // Find max ID
  const maxId = campaigns.reduce((max, c) => {
    const cId = parseInt(c.id);
    return !isNaN(cId) && cId > max ? cId : max;
  }, 0);

  const newId = (maxId + 1).toString();
  
  const newCampaign = {
    ...campaignData,
    id: newId,
    status: 'Active',
    createdAt: new Date().toISOString()
  };
  
  campaigns.push(newCampaign);
  await writeCampaigns(campaigns);
  
  return newCampaign;
}

// Update campaign
async function updateCampaign(id, campaignData) {
  const campaigns = await readCampaigns();
  const index = campaigns.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Campaign not found');
  }

  const updatedCampaign = { ...campaigns[index], ...campaignData };
  campaigns[index] = updatedCampaign;
  await writeCampaigns(campaigns);
  
  return updatedCampaign;
}

// Delete campaign
async function deleteCampaign(id) {
  const campaigns = await readCampaigns();
  const newCampaigns = campaigns.filter(c => c.id !== id);
  await writeCampaigns(newCampaigns);
  return newCampaigns;
}

module.exports = {
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign
};
