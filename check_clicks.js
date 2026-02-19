const mongoose = require('mongoose');
require('dotenv').config();

const Click = require('./models/Click');

async function checkClicks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all clicks
        const allClicks = await Click.find({}).sort({ timestamp: -1 }).limit(20);
        
        console.log(`\nFound ${allClicks.length} recent clicks:\n`);
        
        allClicks.forEach((click, index) => {
            console.log(`${index + 1}. Click ID: ${click.click_id}`);
            console.log(`   Camp ID: ${click.camp_id}`);
            console.log(`   Publisher: ${click.publisher_id}`);
            console.log(`   isSampled: ${click.isSampled}`);
            console.log(`   Timestamp: ${click.timestamp}`);
            console.log('');
        });

        // Group by campaign
        const byCampaign = await Click.aggregate([
            {
                $group: {
                    _id: '$camp_id',
                    count: { $sum: 1 },
                    withIsSampled: {
                        $sum: { $cond: [{ $ifNull: ['$isSampled', false] }, 1, 0] }
                    }
                }
            }
        ]);

        console.log('\nClicks by Campaign:');
        byCampaign.forEach(camp => {
            console.log(`Campaign ${camp._id}: ${camp.count} clicks, ${camp.withIsSampled} with isSampled field`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkClicks();
