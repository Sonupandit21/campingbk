const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    const c1 = await Campaign.findOne({ campaignId: 1 });
    if (c1) {
        console.log(`[Campaign 1]`);
        console.log(`Override URL: ${c1.overrideUrl}`);
        console.log(`Default URL: ${c1.defaultUrl}`);
        
        // Validation
        if (c1.overrideUrl && c1.overrideUrl.includes('p1={click_id}')) {
            console.log('VALIDATION: Override URL correctly maps p1 to {click_id}.');
        } else {
            console.log('VALIDATION FAIL: Override URL does NOT map p1 to {click_id}!');
        }
    } else {
        console.log('Campaign 1 not found.');
    }
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
