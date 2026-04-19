require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');

async function debugCampaigns() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. List All Campaigns
        const campaigns = await Campaign.find({});
        console.log(`Found ${campaigns.length} total campaigns.`);
        
        campaigns.forEach(c => {
            console.log(`- Title: "${c.title}"`);
            console.log(`  ID: ${c.campaignId} (Type: ${typeof c.campaignId})`);
            console.log(`  _id: ${c._id}`);
        });

        // 2. Specific Lookup Test
        console.log('\n--- LOOKUP TESTS ---');
        
        // Test Number
        const cNum = await Campaign.findOne({ campaignId: 888889 });
        console.log(`Query { campaignId: 888889 } (Number) -> Found: ${!!cNum}`);

        // Test String
        const cStr = await Campaign.findOne({ campaignId: "888889" });
        console.log(`Query { campaignId: "888889" } (String) -> Found: ${!!cStr}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debugCampaigns();
