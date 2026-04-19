require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');

async function checkSamplingRule() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const campaign = await Campaign.findOne({ campaignId: 11 });
        if (!campaign) {
            console.log('Campaign 11 not found');
            return;
        }

        console.log('\n=== Campaign 11 Sampling Rules ===');
        console.log('Campaign:', campaign.title);
        console.log('Number of rules:', campaign.sampling ? campaign.sampling.length : 0);
        
        if (campaign.sampling && campaign.sampling.length > 0) {
            campaign.sampling.forEach((rule, i) => {
                console.log(`\nRule ${i + 1}:`);
                console.log('  Publisher ID:', rule.publisherId);
                console.log('  Publisher Name:', rule.publisherName);
                console.log('  Sampling Type:', rule.samplingType);
                console.log('  Sampling Value:', rule.samplingValue);
                console.log('  Sub IDs Type:', rule.subIdsType);
                console.log('  Goal Name:', rule.goalName);
                console.log('  Full Rule:', JSON.stringify(rule, null, 2));
            });
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

checkSamplingRule();
