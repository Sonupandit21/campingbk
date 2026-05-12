const mongoose = require('mongoose');
require('dotenv').config();
const Click = require('./models/Click');

async function checkIpAndUnique() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const clicks = await Click.find({}).sort({ timestamp: -1 }).limit(10);
        console.log('\nLast 10 clicks:');
        clicks.forEach((c, i) => {
            console.log(`${i+1}. IP: ${c.ip_address}, Source: "${c.source}", ID: ${c.click_id}, Sampled: ${c.isSampled}`);
        });

        const uniqueIps = await Click.distinct('ip_address');
        console.log(`\nTotal Unique IPs in entire collection: ${uniqueIps.length}`);

        const today = new Date();
        today.setHours(0,0,0,0);
        const uniqueIpsToday = await Click.distinct('ip_address', { timestamp: { $gte: today } });
        console.log(`Total Unique IPs today: ${uniqueIpsToday.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}
checkIpAndUnique();
