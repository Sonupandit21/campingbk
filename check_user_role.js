const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    // List all users to see what we have
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
