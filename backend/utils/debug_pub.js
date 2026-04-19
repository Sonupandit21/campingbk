const mongoose = require('mongoose');
const Publisher = require('../models/Publisher');
require('dotenv').config();

async function checkPublishers() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Fetching publishers...');
        const publishers = await Publisher.find().sort({ createdAt: -1 });
        console.log(`Found ${publishers.length} publishers.`);
        console.log('Sample:', publishers[0]);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkPublishers();
