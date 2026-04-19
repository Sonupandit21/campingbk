// Test the updated aggregation logic
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function testUpdatedLogic() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');
    
    const Conversion = require('./models/Conversion');
    
    // Test the NEW aggregation logic for campaign 13
    console.log('Testing UPDATED aggregation logic for campaign 13:\n');
    
    const result = await Conversion.aggregate([
      { $match: { camp_id: '13' } },
      {
        $group: {
          _id: null,
          total_records: { $sum: 1 },
          
          // OLD logic - counts all approved
          old_conversions: { 
            $sum: { 
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0] 
            } 
          },
          
          // NEW logic - counts approved BUT NOT originally sampled
          new_conversions: { 
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ["$status", "approved"] },
                    { $ne: ["$originalStatus", "sampled"] }
                  ]
                }, 
                1, 
                0
              ] 
            } 
          },
          
          sampled_conversions: { 
            $sum: { 
              $cond: [{ $eq: ["$originalStatus", "sampled"] }, 1, 0] 
            } 
          },
          
          gross_conversions: { $sum: 1 }
        }
      }
    ]);
    
    if (result.length > 0) {
      const data = result[0];
      console.log('Results:');
      console.log(`  Total conversion records: ${data.total_records}`);
      console.log(`  Gross conversions: ${data.gross_conversions}`);
      console.log(`  Sampled conversions (originalStatus='sampled'): ${data.sampled_conversions}`);
      console.log('');
      console.log(`  OLD logic conversions (status='approved'): ${data.old_conversions}`);
      console.log(`  NEW logic conversions (approved AND NOT sampled): ${data.new_conversions}`);
      console.log('');
      
      if (data.new_conversions === 0) {
        console.log('✅ SUCCESS: New logic correctly shows 0 conversions!');
      } else {
        console.log(`⚠️  New logic shows ${data.new_conversions} conversions (expected 0)`);
      }
    } else {
      console.log('No conversions found for campaign 13');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUpdatedLogic();
