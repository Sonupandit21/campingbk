// Quick test script to verify originalStatus implementation
// Run this with: node test_original_status.js

const mongoose = require('mongoose');
require('dotenv').config();

// Use the correct env variable name
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function testOriginalStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected\n');
    
    // Load the Conversion model (it should have originalStatus now)
    const Conversion = require('./models/Conversion');
    
    // Check total conversions
    const total = await Conversion.countDocuments({});
    console.log(`Total conversions: ${total}`);
    
    if (total === 0) {
      console.log('\n⚠ No conversions found in database');
      await mongoose.disconnect();
      process.exit(0);
      return;
    }
    
    // Check if any have originalStatus
    const withOriginal = await Conversion.countDocuments({ 
      originalStatus: { $exists: true, $ne: null } 
    });
    
    console.log(`Conversions with originalStatus: ${withOriginal}`);
    console.log(`Conversions missing originalStatus: ${total - withOriginal}\n`);
    
    // Show a sample
    const sample = await Conversion.findOne({}).lean();
    console.log('Sample conversion:');
    console.log(`  status: ${sample.status}`);
    console.log(`  originalStatus: ${sample.originalStatus || 'NOT SET'}`);
    console.log(`  click_id: ${sample.click_id}`);
    
    // If migrations needed
    if (withOriginal < total) {
      console.log('\n⚠ MIGRATION NEEDED!');
      console.log('Running migration now...\n');
      
      const result = await Conversion.updateMany(
        { 
          $or: [
            { originalStatus: { $exists: false } },
            { originalStatus: null }
          ]
        },
        [
          { $set: { originalStatus: '$status' } }
        ]
      );
      
      console.log(`✓ Migrated ${result.modifiedCount} conversions`);
      
      // Verify
      const afterMigration = await Conversion.countDocuments({ 
        originalStatus: { $exists: true, $ne: null } 
      });
      console.log(`✓ Conversions with originalStatus after migration: ${afterMigration}`);
    } else {
      console.log('\n✓ All conversions have originalStatus set');
    }
    
    await mongoose.disconnect();
    console.log('\n✓ Done');
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testOriginalStatus();
