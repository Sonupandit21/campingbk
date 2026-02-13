// Debug script to check what's in the database and what reports are returning
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function debugReports() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');
    
    const Conversion = require('./models/Conversion');
    
    // Get all conversions for campaign 13
    const conversions = await Conversion.find({ camp_id: '13' }).lean();
    
    console.log(`Found ${conversions.length} conversions for campaign 13:\n`);
    
    conversions.forEach((conv, idx) => {
      console.log(`Conversion ${idx + 1}:`);
      console.log(`  click_id: ${conv.click_id}`);
      console.log(`  status: ${conv.status}`);
      console.log(`  originalStatus: ${conv.originalStatus || 'NOT SET'}`);
      console.log(`  createdAt: ${conv.createdAt}`);
      console.log('');
    });
    
    // Count by status
    const statusCounts = await Conversion.aggregate([
      { $match: { camp_id: '13' } },
      { $group: { 
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    
    console.log('Counts by status field:');
    statusCounts.forEach(s => console.log(`  ${s._id}: ${s.count}`));
    
    // Count by originalStatus
    const originalStatusCounts = await Conversion.aggregate([
      { $match: { camp_id: '13' } },
      { $group: { 
        _id: '$originalStatus',
        count: { $sum: 1 }
      }}
    ]);
    
    console.log('\nCounts by originalStatus field:');
    originalStatusCounts.forEach(s => console.log(`  ${s._id || 'NULL/UNDEFINED'}: ${s.count}`));
    
    // Test the report aggregation
    console.log('\n--- Testing Report Aggregation ---');
    const reportResult = await Conversion.aggregate([
      { $match: { camp_id: '13' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sampled_by_status: {
            $sum: { $cond: [{ $eq: ['$status', 'sampled'] }, 1, 0] }
          },
          sampled_by_originalStatus: {
            $sum: { $cond: [{ $eq: ['$originalStatus', 'sampled'] }, 1, 0] }
          }
        }
      }
    ]);
    
    console.log('Aggregation result:');
    console.log(JSON.stringify(reportResult[0], null, 2));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugReports();
