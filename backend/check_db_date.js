const mongoose = require('mongoose');
const Conversion = require('./models/Conversion');
const Click = require('./models/Click');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // User's current time is around 2026-02-06 11:53 AM
    // Let's check for any conversions created on 2026-02-06
    
    const start = new Date('2026-02-06T00:00:00Z');
    const end = new Date('2026-02-06T23:59:59.999Z');
    
    console.log('Querying from', start, 'to', end);

    const count = await Conversion.countDocuments({
        createdAt: { $gte: start, $lte: end }
    });
    
    console.log(`Conversions found for 2026-02-06: ${count}`);
    
    if (count > 0) {
        const sample = await Conversion.findOne({
            createdAt: { $gte: start, $lte: end }
        });
        console.log('Sample Conversion:', JSON.stringify(sample, null, 2));
    } else {
        // Check finding ANY conversion to see if DB is empty
        const anyConv = await Conversion.findOne().sort({createdAt: -1});
        console.log('Latest Conversion (any date):', anyConv ? anyConv.createdAt : 'None');
    }

    // Check Clicks
    const clickCount = await Click.countDocuments({
        timestamp: { $gte: start, $lte: end }
    });
    console.log(`Clicks found for 2026-02-06: ${clickCount}`);
    
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
