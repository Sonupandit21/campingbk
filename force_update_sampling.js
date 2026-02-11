require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');

async function forceUpdateSampling() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Use findOneAndUpdate for atomic operation
        const result = await Campaign.findOneAndUpdate(
            { campaignId: 11 },
            { $set: { 'sampling.0.samplingValue': 50 } },
            { new: true }
        );

        if (result) {
            console.log('\n✓ Updated successfully');
            console.log('New sampling value:', result.sampling[0].samplingValue);
            console.log('\nFull rule:');
            console.log(JSON.stringify(result.sampling[0], null, 2));
        } else {
            console.log('Campaign not found');
        }

    } catch (e) {
        console.error('Error:', e.message);
        console.error('Stack:', e.stack);
    } finally {
        await mongoose.disconnect();
    }
}

forceUpdateSampling();
