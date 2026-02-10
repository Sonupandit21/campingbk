const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address as an argument.');
    process.exit(1);
}

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://singhshobhit7100:263155@cluster0.p7xrq.mongodb.net/campaign_db?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                console.error(`User with email ${email} not found.`);
                process.exit(1);
            }

            user.role = 'superadmin';
            await user.save();
            console.log(`Successfully updated user ${user.name} (${user.email}) to role: superadmin`);
        } catch (err) {
            console.error('Error updating user:', err);
        } finally {
            mongoose.disconnect();
            process.exit(0);
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
