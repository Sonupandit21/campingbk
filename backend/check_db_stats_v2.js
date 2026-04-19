const mongoose = require('mongoose');
const Click = require('./models/Click');
const Conversion = require('./models/Conversion');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // Explicitly check for ANY data first
    const clickCount = await Click.countDocuments();
    const conversionCount = await Conversion.countDocuments();
    
    console.log(`Total Clicks: ${clickCount}`);
    console.log(`Total Conversions: ${conversionCount}`);
    
    if (clickCount > 0) {
        const lastClick = await Click.findOne().sort({ _id: -1 });
        console.log('Last Click:', JSON.stringify(lastClick, null, 2));
    }

    if (conversionCount > 0) {
        const lastConv = await Conversion.findOne().sort({ _id: -1 });
        console.log('Last Conversion:', JSON.stringify(lastConv, null, 2));
    }
    
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
