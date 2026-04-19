const mongoose = require('mongoose');
require('dotenv').config();

const Campaign = require('./models/Campaign');

async function listAllCampaigns() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const campaigns = await Campaign.find({}, 'campaignId title clicksSettings');
        
        console.log(`Found ${campaigns.length} campaigns:\n`);
        
        campaigns.forEach(c => {
            console.log(`ID: ${c.campaignId} | Title: ${c.title}`);
            if (c.clicksSettings && c.clicksSettings.length > 0) {
                console.log(`  Settings: ${JSON.stringify(c.clicksSettings)}`);
            } else {
                console.log(`  Settings: []`);
            }
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

listAllCampaigns();
