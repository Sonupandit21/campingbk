// const mongoose = require('mongoose');
// const User = require('./models/User');
// require('dotenv').config();

// mongoose.connect(process.env.MONGODB_URI)
//   .then(async () => {
//     console.log('Connected to DB');
//     const email = 'sonu@gmail.com';
    
//     // Update role to 'admin' (which will display as 'Administrator' via our generic title-casing)
//     // Note: The schema enum allows 'user' or 'admin'. 
//     const res = await User.updateOne(
//         { email: email },
//         { $set: { role: 'admin' } } 
//     );
    
//     if (res.matchedCount === 0) {
//         console.log(`User ${email} not found.`);
//     } else {
//         console.log(`User ${email} updated successfully to admin.`);
//     }
    
//     process.exit();
//   })
//   .catch(err => {
//     console.error(err);
//     process.exit(1);
//   });
