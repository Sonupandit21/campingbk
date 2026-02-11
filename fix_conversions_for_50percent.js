require('dotenv').config();
const mongoose = require('mongoose');
const Conversion = require('./models/Conversion');
const Campaign = require('./models/Campaign');

async function fixConversions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Check current sampling rule
        const campaign = await Campaign.findOne({ campaignId: 11 });
        if (campaign && campaign.sampling && campaign.sampling.length > 0) {
            console.log('\n=== Current Sampling Rule ===');
            console.log('Sampling Type:', campaign.sampling[0].samplingType);
            console.log('Sampling Value:', campaign.sampling[0].samplingValue);
        }

        // Get all conversions for campaign 11, publisher 2
        const conversions = await Conversion.find({
            camp_id: '11',
            publisher_id: '2'
        }).sort({ createdAt: 1 }); // Sort by oldest first

        console.log(`\n=== Current Conversions (${conversions.length} total) ===`);
        conversions.forEach((conv, i) => {
            console.log(`${i + 1}. ClickID: ${conv.click_id}, Status: ${conv.status}, Created: ${conv.createdAt}`);
        });

        if (conversions.length >= 2) {
            // For 50% sampling: Mark first one as sampled, second as approved
            console.log('\n=== Fixing for 50% Sampling ===');
            
            // Keep first as sampled
            if (conversions[0].status !== 'sampled') {
                conversions[0].status = 'sampled';
                await conversions[0].save();
                console.log(`✓ Set conversion 1 to sampled`);
            } else {
                console.log(`- Conversion 1 already sampled`);
            }
            
            // Change second to approved
            if (conversions[1].status !== 'approved') {
                conversions[1].status = 'approved';
                await conversions[1].save();
                console.log(`✓ Set conversion 2 to approved`);
            } else {
                console.log(`- Conversion 2 already approved`);
            }
        }

        // Verify final state
        const updated = await Conversion.find({
            camp_id: '11',
            publisher_id: '2'
        });

        console.log('\n=== Final State ===');
        const sampledCount = updated.filter(c => c.status === 'sampled').length;
        const approvedCount = updated.filter(c => c.status === 'approved').length;
        
        console.log(`Total: ${updated.length}`);
        console.log(`Sampled: ${sampledCount}`);
        console.log(`Approved: ${approvedCount}`);
        
        updated.forEach((conv, i) => {
            console.log(`${i + 1}. ClickID: ${conv.click_id}, Status: ${conv.status}`);
        });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

fixConversions();
