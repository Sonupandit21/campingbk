const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    // Searching for Campaign 2 or one with matching URL part
    const campaign = await Campaign.findOne({ 
        $or: [
            { campaignId: 2 }, 
            { defaultUrl: /policybazaar/i },
            { overrideUrl: /policybazaar/i }
        ] 
    });
    
    if (campaign) {
        console.log(`FOUND CAMPAIGN:`);
        console.log(`ID: ${campaign.campaignId}`);
        console.log(`Default URL: ${campaign.defaultUrl}`);
        console.log(`Override URL: ${campaign.overrideUrl}`);
    } else {
        console.log('Campaign not found.');
    }
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
