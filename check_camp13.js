const mongoose = require('mongoose');
require('dotenv').config();

const Click = require('./models/Click');

async function checkCampaign13() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const clicks = await Click.find({ camp_id: '13' }).sort({ timestamp: 1 });
        
        console.log(`Found ${clicks.length} clicks for Campaign 13:\n`);
        
        let sampledCount = 0;
        let notSampledCount = 0;
        let noFieldCount = 0;

        clicks.forEach((c, i) => {
            const isSampled = c.isSampled;
            if (isSampled === true) sampledCount++;
            else if (isSampled === false) notSampledCount++;
            else noFieldCount++;

            if (i < 5 || i > clicks.length - 5) {
                console.log(`${i + 1}. ID: ${c.click_id} | isSampled: ${isSampled} | Time: ${c.timestamp}`);
            }
        });

        console.log('\nSummary:');
        console.log(`Sampled: ${sampledCount}`);
        console.log(`Not Sampled: ${notSampledCount}`);
        console.log(`No Field: ${noFieldCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkCampaign13();
