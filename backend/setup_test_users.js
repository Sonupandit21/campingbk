const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('password123', 8);

    // Super Admin
    await User.findOneAndUpdate(
      { email: 'super@test.com' },
      { 
        email: 'super@test.com',
        password: hashedPassword,
        role: 'superadmin',
        name: 'Super Admin'
      },
      { upsert: true, new: true }
    );
    console.log('Super Admin setup: super@test.com / password123');

    // Campaign Admin
    await User.findOneAndUpdate(
      { email: 'campaign@test.com' },
      { 
        email: 'campaign@test.com',
        password: hashedPassword,
        role: 'admin',
        name: 'Campaign Admin'
      },
      { upsert: true, new: true }
    );
    console.log('Campaign Admin setup: campaign@test.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupTestUsers();
