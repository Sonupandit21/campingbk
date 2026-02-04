const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
require('dotenv').config();

const newUrl = "https://health.policybazaar.com/?utm_source=ad2clickd&utm_medium=affiliate&utm_campaign=health_insurance_2208&click_id={click_id}";

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // Update Campaign 2
    const res = await Campaign.findOneAndUpdate(
        { campaignId: 2 },
        { 
            defaultUrl: newUrl,
            overrideUrl: newUrl 
        },
        { new: true, upsert: true } // Create if not exists
    );
    
    console.log('Updated Campaign 2 URL to:', res.defaultUrl);
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
