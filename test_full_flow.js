require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
const Conversion = require('./models/Conversion');
const { reprocessConversions } = require('./routes/reprocess');

async function testFullFlow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB\n');

        const campaign = await Campaign.findOne({ campaignId: 11 });
        
        console.log('═══════════════════════════════════════════');
        console.log('   SAMPLING UPDATE TEST - FULL FLOW');
        console.log('═══════════════════════════════════════════\n');

        // Step 1: Show current state
        console.log('📊 STEP 1: Current State');
        console.log('─────────────────────────');
        console.log('Campaign:', campaign.title);
        console.log('Current Sampling:', campaign.sampling[0].samplingValue + '%');
        
        let convs = await Conversion.find({ camp_id: '11' });
        let sampled = convs.filter(c => c.status === 'sampled').length;
        let approved = convs.filter(c => c.status === 'approved').length;
        
        console.log('Conversions:');
        console.log('  - Gross:', convs.length);
        console.log('  - Sampled:', sampled);
        console.log('  - Approved:', approved);

        // Step 2: Change sampling to 100%
        console.log('\n🔧 STEP 2: Changing Sampling to 100%');
console.log('─────────────────────────');
        campaign.sampling[0].samplingValue = 100;
        await campaign.save();
        console.log('✓ Saved to database');

        // Step 3: Reprocess
        console.log('\n⚙️  STEP 3: Reprocessing Conversions');
        console.log('─────────────────────────');
        await reprocessConversions(campaign.campaignId, campaign.sampling);
        console.log('✓ Reprocessing completed');

        // Step 4: Check results
        console.log('\n📈 STEP 4: Results After 100% Sampling');
        console.log('─────────────────────────');
        convs = await Conversion.find({ camp_id: '11' });
        sampled = convs.filter(c => c.status === 'sampled').length;
        approved = convs.filter(c => c.status === 'approved').length;
        
        console.log('Conversions:');
        console.log('  - Gross:', convs.length);
        console.log('  - Sampled:', sampled, '(Expected: 2)');
        console.log('  - Approved:', approved, '(Expected: 0)');
        
        const test1Pass = sampled === 2 && approved === 0;
        console.log('\nTest 1:', test1Pass ? '✅ PASS' : '❌ FAIL');

        // Step 5: Change back to 50%
        console.log('\n🔧 STEP 5: Changing Back to 50%');
        console.log('─────────────────────────');
        campaign.sampling[0].samplingValue = 50;
        await campaign.save();
        await reprocessConversions(campaign.campaignId, campaign.sampling);
        console.log('✓ Updated and reprocessed');

        // Step 6: Final check
        console.log('\n📈 STEP 6: Results After 50% Sampling');
        console.log('─────────────────────────');
        convs = await Conversion.find({ camp_id: '11' });
        sampled = convs.filter(c => c.status === 'sampled').length;
        approved = convs.filter(c => c.status === 'approved').length;
        
        console.log('Conversions:');
        console.log('  - Gross:', convs.length);
        console.log('  - Sampled:', sampled, '(Expected: 1)');
        console.log('  - Approved:', approved, '(Expected: 1)');
        
        const test2Pass = sampled === 1 && approved === 1;
        console.log('\nTest 2:', test2Pass ? '✅ PASS' : '❌ FAIL');

        // Final Summary
        console.log('\n═══════════════════════════════════════════');
        console.log('   FINAL SUMMARY');
        console.log('═══════════════════════════════════════════');
        console.log('Backend reprocessing:', test1Pass && test2Pass ? '✅ WORKING' : '❌ BROKEN');
        console.log('Database state: 50% sampling');
        console.log('Ready for frontend testing!');
        console.log('\n💡 Next Steps:');
        console.log('1. Refresh Campaign Details page');
        console.log('2. Edit sampling rule (should show 50)');
        console.log('3. Change to any value');
        console.log('4. Save and wait for success message');
        console.log('5. Go to Reports and click 🔄 Refresh');
        console.log('═══════════════════════════════════════════\n');

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

testFullFlow();
