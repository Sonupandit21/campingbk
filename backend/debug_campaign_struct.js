require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');

async function debugStruct() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Find by Title
        const c = await Campaign.findOne({ title: /Unstop manual/i });
        
        if (c) {
            console.log('--- RAW CAMPAIGN DOC ---');
            console.log(JSON.stringify(c.toObject(), null, 2));
            console.log('------------------------');
            console.log(`campaignId: ${c.campaignId} (Type: ${typeof c.campaignId})`);
        } else {
            console.log('Campaign "Unstop manual" not found by title.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debugStruct();
