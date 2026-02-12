require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
const { reprocessConversions } = require('./routes/reprocess');

async function testIdLookup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Testing ID lookup logic...\n');

        // Test 1: Lookup by campaignId (numeric) - THIS IS WHAT THE FRONTEND SENDS
        const id = "11"; // Frontend sends campaignId as string
        
        console.log(`Input ID: "${id}" (type: ${typeof id})`);
        console.log('Is numeric:', !isNaN(id));
        console.log('Is ObjectId:', mongoose.Types.ObjectId.isValid(id));
        
        // Old way (BROKEN)
        console.log('\n=== OLD WAY (findById) ===');
        const oldWay = await Campaign.findById(id).catch(() => null);
        console.log('Result:', oldWay ? `Found: ${oldWay.title}` : 'NOT FOUND ❌');

        // New way (FIXED)
        console.log('\n=== NEW WAY (findOne by campaignId) ===');
        let campaign;
        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        
        if (!isObjectId && !isNaN(id)) {
          campaign = await Campaign.findOne({ campaignId: Number(id) });
        } else if (isObjectId) {
          campaign = await Campaign.findById(id);
        }
        
        console.log('Result:', campaign ? `Found: ${campaign.title} ✅` : 'NOT FOUND');

        if (campaign) {
            console.log('\n=== Testing Reprocessing ===');
            console.log('Campaign ID:', campaign.campaignId);
            console.log('Sampling:', campaign.sampling[0].samplingValue + '%');
            
            await reprocessConversions(campaign.campaignId, campaign.sampling);
            console.log('✓ Reprocessing completed successfully!');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

testIdLookup();
