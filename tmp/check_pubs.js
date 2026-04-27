const mongoose = require('mongoose');
const path = require('path');

// Dynamically load model
const Publisher = require(path.join(process.cwd(), 'backend', 'models', 'Publisher'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campingbk';

async function check() {
    try {
        console.log('Connecting to', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const count = await Publisher.countDocuments();
        console.log('Total Publishers:', count);

        const publishers = await Publisher.find().limit(10);
        publishers.forEach(p => {
            console.log(`- ID: ${p.publisherId}, Email: ${p.email}, Token: ${p.securityToken || 'MISSING'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
