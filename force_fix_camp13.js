const mongoose = require('mongoose');
require('dotenv').config();

const Click = require('./models/Click');

async function forceFixCampaign13() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Get clicks for campaign 13
        const clicks = await Click.find({ camp_id: '13' }).sort({ timestamp: 1 });
        console.log(`Found ${clicks.length} clicks for Campaign 13`);

        if (clicks.length === 0) {
            console.log('No clicks found');
            return;
        }

        // We want 50% cutoff.
        // 17 clicks -> 8 sampled (approx 50%)
        // We'll mark the LAST 8 clicks as sampled.
        const numToSample = 8;
        const startIndex = clicks.length - numToSample; // 17 - 8 = 9. Index 9..16

        console.log(`Will mark last ${numToSample} clicks as SAMPLED (indices ${startIndex} to ${clicks.length - 1})`);
        console.log(`First ${startIndex} clicks will be NOT SAMPLED`);

        for (let i = 0; i < clicks.length; i++) {
            const click = clicks[i];
            const shouldBeSampled = i >= startIndex;
            
            await Click.updateOne(
                { _id: click._id },
                { $set: { isSampled: shouldBeSampled } }
            );
            
            console.log(`Click ${i+1}: ${click.click_id} -> ${shouldBeSampled ? 'SAMPLED' : 'NOT SAMPLED'}`);
        }

        console.log('Done.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

forceFixCampaign13();
