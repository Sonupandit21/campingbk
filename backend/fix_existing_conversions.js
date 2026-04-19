require('dotenv').config();
const mongoose = require('mongoose');
const Conversion = require('./models/Conversion');

async function fixExistingConversions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find all approved conversions for campaign 11, publisher 2
        const query = {
            camp_id: '11',
            publisher_id: '2',
            status: 'approved'
        };

        const conversions = await Conversion.find(query);
        console.log(`\nFound ${conversions.length} approved conversions for campaign 11, publisher 2`);

        if (conversions.length > 0) {
            console.log('\n=== Conversions to update ===');
            conversions.forEach((conv, i) => {
                console.log(`${i + 1}. ClickID: ${conv.click_id}, Status: ${conv.status}, Created: ${conv.createdAt}`);
            });

            // Update them to 'sampled'
            const result = await Conversion.updateMany(query, { $set: { status: 'sampled' } });
            console.log(`\n✓ Updated ${result.modifiedCount} conversions to 'sampled' status`);

            // Verify
            const verified = await Conversion.find({ camp_id: '11', publisher_id: '2' });
            console.log('\n=== After Update ===');
            verified.forEach((conv, i) => {
                console.log(`${i + 1}. ClickID: ${conv.click_id}, Status: ${conv.status}`);
            });
        } else {
            console.log('\nNo conversions to update');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

fixExistingConversions();
