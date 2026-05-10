const mongoose = require('mongoose');
const Conversion = require('./models/Conversion');

async function checkConversions() {
    try {
        await mongoose.connect('mongodb+srv://sonu8745075525_db_user:AiwTR0w5tawVQXMM@cluster0.ph03yin.mongodb.net/');
        console.log('Connected to DB');
        
        const count = await Conversion.countDocuments({});
        console.log('Total Conversions:', count);
        
        const zeroPayout = await Conversion.countDocuments({ payout: 0 });
        console.log('Conversions with 0 payout:', zeroPayout);
        
        const samples = await Conversion.find({ payout: 0 }).limit(5);
        console.log('Sample zero payout conversions:', JSON.stringify(samples, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkConversions();
