const mongoose = require('mongoose');
require('dotenv').config();

const Campaign = require('./models/Campaign');
const Click = require('./models/Click');

async function findCashbackMaster() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Find campaign with "Cashback" in the title
        const campaigns = await Campaign.find({ 
            title: { $regex: /cashback/i } 
        });
        
        console.log(`Found ${campaigns.length} campaigns with "Cashback" in title:\n`);
        
        for (const camp of campaigns) {
            console.log(`Campaign: ${camp.title}`);
            console.log(`  Campaign ID: ${camp.campaignId}`);
            console.log(`  MongoDB _id: ${camp._id}`);
            console.log(`  Cutoff Settings:`, JSON.stringify(camp.clicksSettings, null, 2));
            
            // Find clicks for this campaign
            const clicksByNumericId = await Click.countDocuments({ camp_id: String(camp.campaignId) });
            const clicksByMongoId = await Click.countDocuments({ camp_id: camp._id.toString() });
            
            console.log(`  Clicks (by campaignId ${camp.campaignId}): ${clicksByNumericId}`);
            console.log(`  Clicks (by _id): ${clicksByMongoId}`);
            
            // Check how many have isSampled set
            const withIsSampled = await Click.countDocuments({ 
                camp_id: String(camp.campaignId),
                isSampled: { $exists: true }
            });
            const sampledTrue = await Click.countDocuments({ 
                camp_id: String(camp.campaignId),
                isSampled: true
            });
            
            console.log(`  Clicks with isSampled field: ${withIsSampled}`);
            console.log(`  Clicks marked as sampled (true): ${sampledTrue}`);
            console.log('');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

findCashbackMaster();
