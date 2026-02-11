const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
const Publisher = require('./models/Publisher');
const { getAllPublishers } = require('./utils/publisherStore');

async function testPublisherMatch() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Get Campaign 11
        const campaign = await Campaign.findOne({ campaignId: 11 });
        if (!campaign) {
            console.log('Campaign 11 not found');
            return;
        }

        console.log('\n=== CAMPAIGN INFO ===');
        console.log('Campaign ID:', campaign.campaignId);
        console.log('Title:', campaign.title);
        console.log('Sampling Rules:', JSON.stringify(campaign.sampling, null, 2));

        // Get all publishers
        const allPublishers = await getAllPublishers();
        console.log('\n=== ALL PUBLISHERS ===');
        allPublishers.forEach(p => {
            console.log(`Publisher: id=${p.id}, publisherId=${p.publisherId}, referenceId=${p.referenceId}, _id=${p._id}, name=${p.fullName}`);
        });

        // Test matching logic
        const publisher_id = '2'; // From conversion
        console.log(`\n=== TESTING MATCH FOR publisher_id='${publisher_id}' ===`);
        
        const publisherObj = allPublishers.find(p => p.id == publisher_id || p.referenceId == publisher_id || p._id == publisher_id);
        
        if (publisherObj) {
            console.log('✓ Publisher Found:', publisherObj.fullName);
            console.log('  - id:', publisherObj.id);
            console.log('  - publisherId:', publisherObj.publisherId);
            console.log('  - referenceId:', publisherObj.referenceId);
            console.log('  - _id:', publisherObj._id);
        } else {
            console.log('✗ Publisher NOT found');
        }

        // Test rule matching
        if (campaign.sampling && campaign.sampling.length > 0) {
            const rule = campaign.sampling[0];
            console.log(`\n=== TESTING RULE MATCH ===`);
            console.log('Rule PubID:', rule.publisherId);
            console.log('Conversion PubID:', publisher_id);
            
            if (publisherObj) {
                const match = 
                    (publisherObj.id && String(publisherObj.id) === String(rule.publisherId)) ||
                    (publisherObj._id && publisherObj._id.toString() === String(rule.publisherId)) ||
                    (publisherObj.referenceId && String(publisherObj.referenceId) === String(rule.publisherId));
                
                console.log('Match Result:', match);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

testPublisherMatch();
