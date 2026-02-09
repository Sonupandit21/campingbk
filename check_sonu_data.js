const mongoose = require('mongoose');
const Click = require('./models/Click');
const Conversion = require('./models/Conversion');
const Campaign = require('./models/Campaign');
const Publisher = require('./models/Publisher');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const pubId = 2;
    const pubString = "2";

    console.log(`Checking data for Publisher ID: ${pubId}`);

    // Check Publisher
    const items = await Publisher.find({ publisherId: pubId });
    console.log(`Publishers found: ${items.length}`);
    items.forEach(p => console.log(`- ${p.fullName} (${p.email})`));

    // Check Clicks
    const clicks = await Click.countDocuments({ publisher_id: pubString });
    console.log(`Clicks found: ${clicks}`);

    // Check Conversions
    const conversions = await Conversion.countDocuments({ publisher_id: pubString });
    console.log(`Conversions found: ${conversions}`);

    // Check Campaigns (if assigned logic exists, but 'Publisher' model doesn't show assignment)
    // Maybe clicks show which campaigns are active
    const distinctCamps = await Click.distinct('camp_id', { publisher_id: pubString });
    console.log(`Campaigns with traffic: ${distinctCamps}`);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

checkData();
