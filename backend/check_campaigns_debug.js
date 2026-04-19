const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    const campaigns = await Campaign.find({});
    console.log('Found campaigns:', campaigns.length);
    campaigns.forEach(c => {
        console.log(`_id: ${c._id}, campaignId: ${c.campaignId}, title: ${c.title}, overrideUrl: ${c.overrideUrl}`);
    });
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
