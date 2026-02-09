const mongoose = require('mongoose');
const Publisher = require('./models/Publisher');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const publishers = await Publisher.find({}).sort({ publisherId: 1 });
        console.log('--- Current Publishers ---');
        publishers.forEach(p => {
            console.log(`ID: ${p.publisherId}, Name: ${p.fullName}, Email: ${p.email}`);
        });
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
