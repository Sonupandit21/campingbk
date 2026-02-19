const mongoose = require('mongoose');
require('dotenv').config();

const Click = require('./models/Click');
const Campaign = require('./models/Campaign');

async function verifyCampaign2() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Find campaign 2
        const campaign = await Campaign.findOne({ campaignId: 2 });
        console.log('Campaign 2:', campaign?.title || 'NOT FOUND');
        console.log('Cutoff settings:', JSON.stringify(campaign?.clicksSettings, null, 2));
        
        // Find all clicks for campaign 2
        const clicks = await Click.find({ camp_id: '2' }).sort({ timestamp: 1 });
        
        console.log(`\nTotal clicks for campaign 2: ${clicks.length}`);
        
        const sampledClicks = clicks.filter(c => c.isSampled === true);
        const notSampledClicks = clicks.filter(c => c.isSampled === false);
        const noFieldClicks = clicks.filter(c => c.isSampled === undefined || c.isSampled === null);
        
        console.log(`Sampled clicks (isSampled=true): ${sampledClicks.length}`);
        console.log(`Not sampled clicks (isSampled=false): ${notSampledClicks.length}`);
        console.log(`No isSampled field: ${noFieldClicks.length}`);
        
        console.log('\nFirst 5 clicks:');
        clicks.slice(0, 5).forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.click_id} - isSampled: ${c.isSampled} - timestamp: ${c.timestamp}`);
        });
        
        console.log('\nLast 5 clicks:');
        clicks.slice(-5).forEach((c, i) => {
            console.log(`  ${clicks.length - 4 + i}. ${c.click_id} - isSampled: ${c.isSampled} - timestamp: ${c.timestamp}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

verifyCampaign2();
