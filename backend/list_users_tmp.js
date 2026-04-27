const mongoose = require('mongoose');
require('dotenv').config();

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      mobile: String,
      role: String
    }));

    const users = await User.find({});
    console.log('USERS_START');
    users.forEach(u => {
      console.log(`${u.email} | ${u.role}`);
    });
    console.log('USERS_END');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers();
