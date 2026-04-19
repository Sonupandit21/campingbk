const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
require('dotenv').config();

async function updateCampaign() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Target URL per user request
        // Note: We use {click_id} and {source} macros which are standard. 
        // User asked for "source={source}", but our code maps {source} to param.source.
        const newUrl = "https://jjkjdnc.gotrackier.com/click?campaign_id=5082&pub_id=2&p1={click_id}&source={source}";
        
        // Find campaign with id="3" OR _id="3" (if ObjectId was manually set)
        // OR find by title if ID lookup fails? No, user said camp_id=3.
        
        // 1. Try to find by custom 'id' if added (Schema doesn't have it explicitly, but maybe data does)
        // 2. Try _id
        
        // Let's first search to see what 3 might mean.
        const campaigns = await Campaign.find({});
        let campaign = campaigns.find(c => c._id.toString() == "3" || c.id == "3" || (c._doc && c._doc.id == "3"));

        if (!campaign) {
            console.log('Campaign "3" not found by ID. Listing all campaigns to help identifier:');
            campaigns.forEach(c => console.log(`- ${c.id || c._id}: ${c.title}`));
            
            // Checking if there is a "Campaign 3" in title?
            campaign = campaigns.find(c => c.title.includes("Campaign 3") || c.title.includes("Camp 3"));
        }

        if (campaign) {
            console.log(`Updating campaign: ${campaign._id} (${campaign.title})`);
            console.log(`Old URL: ${campaign.defaultUrl}`);
            
            campaign.defaultUrl = newUrl;
            await campaign.save();
            console.log(`New URL set: ${campaign.defaultUrl}`);
        } else {
            console.error('Campaign not found!');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

updateCampaign();
