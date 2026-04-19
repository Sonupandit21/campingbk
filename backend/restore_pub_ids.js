const mongoose = require('mongoose');
const Publisher = require('./models/Publisher');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Move current ID 1 to 3
        const pub1 = await Publisher.findOne({ publisherId: 1 });
        if (pub1) {
            console.log(`Moving ${pub1.fullName} (ID: 1) to ID 3`);
            await Publisher.updateOne({ _id: pub1._id }, { $set: { publisherId: 3 } });
        }

        // 2. Move 10001 to 1
        const pub10001 = await Publisher.findOne({ publisherId: 10001 });
        if (pub10001) {
             console.log(`Moving ${pub10001.fullName} (ID: 10001) to ID 1`);
             await Publisher.updateOne({ _id: pub10001._id }, { $set: { publisherId: 1 } });
        } else {
            console.log('ID 10001 not found');
        }

        // 3. Move 10002 to 2
        const pub10002 = await Publisher.findOne({ publisherId: 10002 });
        if (pub10002) {
             console.log(`Moving ${pub10002.fullName} (ID: 10002) to ID 2`);
             await Publisher.updateOne({ _id: pub10002._id }, { $set: { publisherId: 2 } });
        } else {
            console.log('ID 10002 not found');
        }
        
        console.log('ID Restoration complete');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
