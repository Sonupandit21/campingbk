const mongoose = require('mongoose');
require('dotenv').config();

// Simple script to check conversion data
async function checkConversions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');
    
    const Conversion = mongoose.model('Conversion', new mongoose.Schema({}, { strict: false }));
    
    const total = await Conversion.countDocuments({});
    console.log(`Total conversions: ${total}`);
    
    if (total > 0) {
      // Check a sample conversion
      const sample = await Conversion.findOne({});
      console.log('\nSample conversion:');
      console.log(JSON.stringify(sample, null, 2));
      
      // Check how many have originalStatus
      const withOriginalStatus = await Conversion.countDocuments({ 
        originalStatus: { $exists: true } 
      });
      console.log(`\nConversions with originalStatus: ${withOriginalStatus}`);
      console.log(`Conversions without originalStatus: ${total - withOriginalStatus}`);
      
      if (withOriginalStatus < total) {
        console.log('\n⚠ WARNING: Some conversions need migration!');
        console.log('Run migration: node migrate_original_status.js');
      } else {
        console.log('\n✓ All conversions have originalStatus set');
      }
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkConversions();
