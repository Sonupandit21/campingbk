const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // IDs seen in screenshot: 1, 2, 5, 5082, "{camp_id}"
    const testIds = [1, 2, 5, 5082];
    
    const campaigns = await Campaign.find({
        campaignId: { $in: testIds }
    });
    
    console.log('Found Campaigns:', campaigns.map(c => ({ 
        id: c.campaignId, 
        type: typeof c.campaignId, 
        title: c.title 
    })));

    const allCampaigns = await Campaign.find({}).limit(5);
    console.log('First 5 Campaigns in DB:', allCampaigns.map(c => ({ 
        id: c.campaignId, 
        type: typeof c.campaignId, 
        title: c.title 
    })));

    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
