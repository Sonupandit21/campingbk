// Check conversions for campaign 13
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkCampaign() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');
    
    const Conversion = require('./models/Conversion');
    
    // Get conversions for campaign 13
    const conversions = await Conversion.find({ camp_id: '13' }).lean();
    
    console.log(`Total conversions for campaign 13: ${conversions.length}\n`);
    
    if (conversions.length > 0) {
      console.log('Details:');
      conversions.forEach((conv, idx) => {
        console.log(`${idx + 1}. click_id: ${conv.click_id}`);
        console.log(`   status: ${conv.status}`);
        console.log(`   originalStatus: ${conv.originalStatus || 'NOT SET'}`);
        console.log(`   createdAt: ${conv.createdAt}`);
        console.log('');
      });
      
      // Count by status
      const approved = conversions.filter(c => c.status === 'approved').length;
      const sampled = conversions.filter(c => c.status === 'sampled').length;
      const originalSampled = conversions.filter(c => c.originalStatus === 'sampled').length;
      
      console.log('Summary:');
      console.log(`  status === 'approved': ${approved}`);
      console.log(`  status === 'sampled': ${sampled}`);
      console.log(`  originalStatus === 'sampled': ${originalSampled}`);
      console.log('');
      
      // Check overlapping cases
      const approvedButOriginalSampled = conversions.filter(
        c => c.status === 'approved' && c.originalStatus === 'sampled'
      ).length;
      
      console.log(`Conversions with status='approved' BUT originalStatus='sampled': ${approvedButOriginalSampled}`);
      console.log('  ^ These are being counted in conversions when they should be excluded!');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCampaign();
