const mongoose = require('mongoose');
require('dotenv').config();

const Click = require('./models/Click');
const Conversion = require('./models/Conversion');
const Campaign = require('./models/Campaign');
const Publisher = require('./models/Publisher');
const User = require('./models/User');

const vacuum = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- DB Diagnostic ---');
        
        const counts = {
            clicks: await Click.countDocuments({}),
            conversions: await Conversion.countDocuments({}),
            campaigns: await Campaign.countDocuments({}),
            publishers: await Publisher.countDocuments({}),
            users: await User.countDocuments({})
        };

        console.table(counts);

        const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);
        console.log(`\nTotal Documents: ${totalDocs}`);

        if (totalDocs > 0) {
            console.log('\n--- Actions ---');
            console.log('Deleting all Clicks to free up space...');
            const clickResult = await Click.deleteMany({});
            console.log(`Deleted ${clickResult.deletedCount} clicks.`);

            // Optionally clear old conversions? (Usually we keep these but if it's 512MB full, we might need to)
            // console.log('Deleting conversions older than 30 days...');
            // const thirtyDaysAgo = new Date();
            // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            // const convResult = await Conversion.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
            // console.log(`Deleted ${convResult.deletedCount} old conversions.`);
        }

        console.log('\n--- Finished ---');
        console.log('IMPORTANT: MongoDB Atlas might take a few minutes to reflect the free space in the dashboard.');
        console.log('It is HIGHLY recommended to add TTL indexes to the Click collection to prevent this in the future.');
        
        process.exit(0);
    } catch (error) {
        console.error('Vacuum Error:', error);
        process.exit(1);
    }
};

vacuum();
