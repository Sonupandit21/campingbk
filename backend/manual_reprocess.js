require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
const Conversion = require('./models/Conversion');
const { reprocessConversions } = require('./routes/reprocess');

async function manualReprocess() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB\n');

        // Get current campaign state
        const campaign = await Campaign.findOne({ campaignId: 11 });
        if (!campaign) {
            console.log('Campaign not found');
            return;
        }

        console.log('=== Campaign 11 - Current State ===');
        console.log('Title:', campaign.title);
        console.log('Sampling Rules:', JSON.stringify(campaign.sampling, null, 2));

        // Get conversions before reprocess
        console.log('\n=== Before Reprocessing ===');
        const beforeConvs = await Conversion.find({ camp_id: '11' }).sort({ createdAt: 1 });
        console.log(`Total: ${beforeConvs.length}`);
        beforeConvs.forEach((c, i) => {
            console.log(`${i + 1}. Status: ${c.status.padEnd(10)} | ClickID: ${c.click_id}`);
        });

        // Reprocess
        console.log('\n=== Running Reprocessing ===');
        await reprocessConversions(campaign.campaignId, campaign.sampling);

        // Get conversions after reprocess
        console.log('\n=== After Reprocessing ===');
        const afterConvs = await Conversion.find({ camp_id: '11' }).sort({ createdAt: 1 });
        
        const sampled = afterConvs.filter(c => c.status === 'sampled').length;
        const approved = afterConvs.filter(c => c.status === 'approved').length;
        
        console.log(`Total: ${afterConvs.length}`);
        console.log(`Sampled: ${sampled}`);
        console.log(`Approved: ${approved}`);
        
        console.log('\nDetails:');
        afterConvs.forEach((c, i) => {
            console.log(`${i + 1}. Status: ${c.status.padEnd(10)} | ClickID: ${c.click_id}`);
        });

        console.log('\n=== Report Summary ===');
        console.log('GROSS CONVERSIONS:', afterConvs.length);
        console.log('SAMPLED CONVERSIONS:', sampled);
        console.log('TOTAL CONVERSIONS (Approved):', approved);
        
        const samplingRule = campaign.sampling[0];
        console.log(`\nExpected with ${samplingRule.samplingValue}% sampling on ${afterConvs.length} conversions:`);
        const expectedSampled = Math.floor((afterConvs.length * samplingRule.samplingValue) / 100);
        console.log(`- Sampled: ${expectedSampled}`);
        console.log(`- Approved: ${afterConvs.length - expectedSampled}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

manualReprocess();
