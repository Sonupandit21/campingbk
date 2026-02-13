const mongoose = require('mongoose');
const Conversion = require('./models/Conversion');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function migrateOriginalStatus() {
  try {
    console.log('Starting migration to set originalStatus for existing conversions...');
    
    // Find all conversions that don't have originalStatus set
    // (or where originalStatus differs from status, which shouldn't happen but we'll fix it)
    const result = await Conversion.updateMany(
      { 
        $or: [
          { originalStatus: { $exists: false } },
          { originalStatus: null }
        ]
      },
      [
        {
          $set: {
            originalStatus: '$status' // Copy current status to originalStatus
          }
        }
      ]
    );
    
    console.log(`Migration complete! Updated ${result.modifiedCount} conversions.`);
    
    // Verify the migration
    const totalConversions = await Conversion.countDocuments({});
    const withOriginalStatus = await Conversion.countDocuments({ 
      originalStatus: { $exists: true, $ne: null } 
    });
    
    console.log(`\nVerification:`);
    console.log(`Total conversions: ${totalConversions}`);
    console.log(`Conversions with originalStatus: ${withOriginalStatus}`);
    
    if (totalConversions === withOriginalStatus) {
      console.log('✓ All conversions now have originalStatus set!');
    } else {
      console.log('⚠ Warning: Some conversions still missing originalStatus');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateOriginalStatus();
