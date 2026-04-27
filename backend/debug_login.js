const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config({ path: './backend/.env' });

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const identifier = '7844521458';
    
    console.log(`Searching for identifier: ${identifier}`);
    
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { mobile: identifier }
      ]
    });

    if (user) {
      console.log('User found:', {
        email: user.email,
        mobile: user.mobile,
        role: user.role
      });
    } else {
      console.log('User NOT found with exact match.');
      
      // Try partial or all users
      const allUsers = await User.find({ role: 'admin' });
      console.log('Admin users in DB:');
      allUsers.forEach(u => {
        console.log(`- Email: ${u.email}, Mobile: "${u.mobile}"`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Debug error:', error);
    process.exit(1);
  }
}

debug();
