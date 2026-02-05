// const mongoose = require('mongoose');
// const User = require('./models/User');
// require('dotenv').config();

// mongoose.connect(process.env.MONGODB_URI)
//   .then(async () => {
//     console.log('Connected to DB');
//     // Update role to 'Administrator' for better display, or 'admin' and fix frontend mapping
//     const res = await User.updateOne(
//         { email: 'admin@admin.com' },
//         { $set: { role: 'Administrator' } } 
//     );
//     console.log('Update result:', res);
//     process.exit();
//   })
//   .catch(err => {
//     console.error(err);
//     process.exit(1);
//   });
