const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
require('dotenv').config();

const trackierUrl = "https://jjkjdnc.gotrackier.com/click?campaign_id=5082&pub_id=2&p1={click_id}&source={source}";

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // Update Campaign 1
    const res = await Campaign.findOneAndUpdate(
        { campaignId: 1 },
        { 
            overrideUrl: trackierUrl,
            defaultUrl: trackierUrl // Update default too just in case
        },
        { new: true }
    );
    
    if (res) {
        console.log(`[SUCCESS] Campaign 1 Updated.`);
        console.log(`New URL: ${res.overrideUrl}`);
    } else {
        console.log(`[ERROR] Campaign 1 not found.`);
    }
    
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
