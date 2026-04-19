require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');

async function fixSamplingType() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find campaign 11
        const campaign = await Campaign.findOne({ campaignId: 11 });
        if (!campaign) {
            console.log('Campaign 11 not found');
            return;
        }

        console.log('\n=== BEFORE ===');
        console.log('Campaign:', campaign.title);
        console.log('Sampling Rules:', JSON.stringify(campaign.sampling, null, 2));

        // Fix all sampling rules that are 'Fixed' to be 'percentage'
        // Since the UI shows % and users expect %, any rule with value like 100 should be percentage
        if (campaign.sampling && campaign.sampling.length > 0) {
            campaign.sampling.forEach((rule, index) => {
                if (rule.samplingType === 'Fixed' || !rule.samplingType) {
                    console.log(`\nFixing rule ${index + 1}: ${rule.samplingType} -> percentage`);
                    rule.samplingType = 'percentage';
                }
            });

            await campaign.save();
            console.log('\n✓ Updated campaign');
        }

        // Verify
        const updated = await Campaign.findOne({ campaignId: 11 });
        console.log('\n=== AFTER ===');
        console.log('Sampling Rules:', JSON.stringify(updated.sampling, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

fixSamplingType();
