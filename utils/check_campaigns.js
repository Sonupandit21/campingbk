const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
require('dotenv').config();

async function checkCampaigns() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const campaigns = await Campaign.find({});
        console.log(`Found ${campaigns.length} campaigns`);
        campaigns.forEach(c => {
            console.log(`- _id: ${c._id}, Title: ${c.title}, ID (virtual/field): ${c.id}, CustomField? ${c._doc.id}`);
        });

        // Try to find one with id "2" explicitly
        const camp2 = campaigns.find(c => c.id == "2" || c._id.toString() == "2");
        if (camp2) {
            console.log('Found campaign with ID 2:', camp2);
        } else {
            console.log('No campaign found with ID 2');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkCampaigns();
