const mongoose = require('mongoose');
const Conversion = require('./models/Conversion');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('--- START DB CHECK ---');
    
    const count = await Conversion.countDocuments({});
    console.log('Total Conversions in DB:', count);

    if (count > 0) {
        const latest = await Conversion.findOne().sort({createdAt: -1});
        console.log('LATEST CONVERSION TIME (ISO):', latest.createdAt.toISOString());
        console.log('LATEST CONVERSION LOCAL (System):', latest.createdAt.toString());
        
        // Check for 2026-02-06 specific
        const start = new Date('2026-02-06T00:00:00Z');
        const end = new Date('2026-02-06T23:59:59.999Z');
        const todayCount = await Conversion.countDocuments({
             createdAt: { $gte: start, $lte: end }
        });
        console.log(`Conversions for 2026-02-06 (UTC): ${todayCount}`);
    } else {
        console.log('No conversions found in DB at all.');
    }

    console.log('--- END DB CHECK ---');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
