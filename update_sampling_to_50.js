require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');

async function updateSamplingValue() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const campaign = await Campaign.findOne({ campaignId: 11 });
        if (!campaign) {
            console.log('Campaign 11 not found');
            return;
        }

        console.log('\n=== BEFORE ===');
        console.log('Sampling Value:', campaign.sampling[0].samplingValue);

        // Update to 50%
        campaign.sampling[0].samplingValue = 50;
        await campaign.save();

        console.log('\n=== AFTER ===');
        console.log('Sampling Value:', campaign.sampling[0].samplingValue);
        console.log('\n✓ Updated sampling value to 50%');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

updateSamplingValue();
