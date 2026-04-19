const mongoose = require('mongoose');
const Publisher = require('./models/Publisher');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Move IDs < 3 to 10000+ range
        const legacyPublishers = await Publisher.find({ publisherId: { $lt: 3 }, created_by: { $ne: null } }); // Assuming current user has created_by set? 
        // actually just move IDs 1 and 2 regardless of owner if they are not the target 'Vikash kumar'
        // But wait, what if 'Vikash kumar' is ID 3?
        
        // Safer: Get all publishers
        const allPublishers = await Publisher.find({});
        
        for (const p of allPublishers) {
            if (p.publisherId === 3) {
                 // confirm it's the one we want to be 1
                 console.log(`Target found: ${p.fullName} (ID: ${p.publisherId})`);
                 // We can't set it to 1 yet if 1 exists.
            }
        }

        // Shift 1 and 2
        for (const p of allPublishers) {
             if (p.publisherId < 3) {
                 const newId = 10000 + p.publisherId;
                 console.log(`Moving ${p.fullName} from ${p.publisherId} to ${newId}`);
                 // Direct update to avoid unique constraint if we do it one by one? 
                 // We need to release ID 1 before assigning it to ID 3.
                 await Publisher.updateOne({ _id: p._id }, { $set: { publisherId: newId } });
             }
        }
        
        // Find the target (Vikash kumar) ID 3 and move to 1
        const target = await Publisher.findOne({ publisherId: 3 });
        if (target) {
            console.log(`Setting ${target.fullName} to ID 1`);
            await Publisher.updateOne({ _id: target._id }, { $set: { publisherId: 1 } });
        }
        
        console.log('Migration complete');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
