require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
const { reprocessConversions } = require('./routes/reprocess');

async function testReprocessing() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB\n');

        const campaign = await Campaign.findOne({ campaignId: 11 });
        if (!campaign) {
            console.log('Campaign 11 not found');
            return;
        }

        console.log('=== Campaign Info ===');
        console.log('Title:', campaign.title);
        console.log('Sampling Rules:', JSON.stringify(campaign.sampling, null, 2));

        console.log('\n=== Running Reprocess ===');
        await reprocessConversions(campaign.campaignId, campaign.sampling);

        console.log('\n=== Checking Results ===');
        const Conversion = require('./models/Conversion');
        const conversions = await Conversion.find({ camp_id: '11' });
        
        console.log(`Total conversions: ${conversions.length}`);
        const sampled = conversions.filter(c => c.status === 'sampled').length;
        const approved = conversions.filter(c => c.status === 'approved').length;
        
        console.log(`Sampled: ${sampled}`);
        console.log(`Approved: ${approved}`);
        
        console.log('\nDetails:');
        conversions.forEach((c, i) => {
            console.log(`${i + 1}. Status: ${c.status}, ClickID: ${c.click_id}`);
        });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

testReprocessing();
