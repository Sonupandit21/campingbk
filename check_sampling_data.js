const mongoose = require('mongoose');
require('dotenv').config();
const Campaign = require('./models/Campaign');
const Publisher = require('./models/Publisher');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const camp = await Campaign.findOne({ campaignId: 11 });
        if (camp) {
            console.log('Campaign 11 found:');
            console.log('Clicks Settings:', JSON.stringify(camp.clicksSettings, null, 2));
        } else {
            console.log('Campaign 11 NOT found by campaignId: 11');
        }

        const pub = await Publisher.findOne({ fullName: 'Admaven' });
        if (pub) {
            console.log('Publisher Admaven found:');
            console.log('ID:', pub.id);
            console.log('_ID:', pub._id);
            console.log('Reference ID:', pub.referenceId);
            console.log('PublisherID:', pub.publisherId);
        } else {
            console.log('Publisher Admaven NOT found');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
