const mongoose = require('mongoose');
const Publisher = require('./models/Publisher');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const publishers = await Publisher.find({});
        console.log('Total Publishers:', publishers.length);
        publishers.forEach(p => {
            console.log(`ID: ${p.publisherId}, Name: ${p.fullName}, CreatedBy: ${p.created_by}, Status: ${p.status}`);
        });
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
