const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
const Publisher = require('./models/Publisher');
require('dotenv').config();

const cleanUp = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Delete all campaigns
        const campResult = await Campaign.deleteMany({});
        console.log(`Deleted ${campResult.deletedCount} campaigns.`);

        // Delete all publishers
        const pubResult = await Publisher.deleteMany({});
        console.log(`Deleted ${pubResult.deletedCount} publishers.`);

        console.log('Cleanup complete. Next items will start at ID: 1');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanUp();
