const mongoose = require('mongoose');
require('dotenv').config();

const Click = require('./models/Click');
const Campaign = require('./models/Campaign');

async function migrateAllClicks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Get all campaigns
        const campaigns = await Campaign.find({});
        console.log(`Found ${campaigns.length} campaigns\n`);

        for (const campaign of campaigns) {
            console.log(`\n=== Processing Campaign: ${campaign.title} (ID: ${campaign.campaignId}) ===`);
            
            // Find all possible camp_id formats for this campaign
            const possibleCampIds = [
                String(campaign.campaignId),
                campaign._id.toString(),
                campaign.id
            ].filter(Boolean);

            console.log(`Looking for clicks with camp_id in:`, possibleCampIds);

            // Get all clicks for this campaign that don't have isSampled set
            const clicks = await Click.find({ 
                camp_id: { $in: possibleCampIds },
                $or: [
                    { isSampled: { $exists: false } },
                    { isSampled: null }
                ]
            }).sort({ timestamp: 1 });

            console.log(`Found ${clicks.length} clicks to migrate`);

            if (clicks.length === 0) {
                console.log('No clicks to migrate for this campaign');
                continue;
            }

            // Find the cutoff rule
            const cutoffRule = campaign.clicksSettings && campaign.clicksSettings.length > 0 
                ? campaign.clicksSettings[0] 
                : null;

            if (!cutoffRule) {
                console.log('No cutoff rule found, marking all as NOT sampled');
                for (const click of clicks) {
                    await Click.updateOne(
                        { _id: click._id },
                        { $set: { isSampled: false } }
                    );
                }
                console.log(`Marked ${clicks.length} clicks as not sampled`);
                continue;
            }

            const cutoffValue = parseFloat(cutoffRule.value) || 0;
            const cutoffType = cutoffRule.cutoffType || 'percentage';

            console.log(`Cutoff: ${cutoffValue}${cutoffType === 'percentage' ? '%' : ' clicks'}`);

            let sampledCount = 0;
            if (cutoffType === 'percentage') {
                // Calculate how many clicks should be sampled
                sampledCount = Math.round(clicks.length * (cutoffValue / 100));
                console.log(`Will mark ${sampledCount} out of ${clicks.length} clicks as sampled (${cutoffValue}%)`);

                // Mark the LAST N clicks as sampled (simulating clicks after cutoff threshold)
                for (let i = 0; i < clicks.length; i++) {
                    const click = clicks[i];
                    // If cutoff is 50%, the LAST 50% of clicks are sampled
                    const shouldBeSampled = i >= (clicks.length - sampledCount);
                    
                    await Click.updateOne(
                        { _id: click._id },
                        { $set: { isSampled: shouldBeSampled } }
                    );
                    
                    if (i < 3 || shouldBeSampled) {  // Show first 3 and all sampled
                        console.log(`  Click ${i + 1}/${clicks.length}: ${click.click_id.substring(0, 8)}... → isSampled = ${shouldBeSampled}`);
                    }
                }
            } else {
                // Count type - first N clicks are NOT sampled, rest are sampled
                for (let i = 0; i < clicks.length; i++) {
                    const click = clicks[i];
                    const shouldBeSampled = i >= cutoffValue;
                    
                    await Click.updateOne(
                        { _id: click._id },
                        { $set: { isSampled: shouldBeSampled } }
                    );
                    
                    if (shouldBeSampled) sampledCount++;
                    
                    if (i < 3 || shouldBeSampled) {
                        console.log(`  Click ${i + 1}/${clicks.length}: ${click.click_id.substring(0, 8)}... → isSampled = ${shouldBeSampled}`);
                    }
                }
            }

            console.log(`\n✓ Migration complete for ${campaign.title}!`);
            console.log(`  Total clicks: ${clicks.length}`);
            console.log(`  Sampled: ${sampledCount}`);
            console.log(`  Non-sampled: ${clicks.length - sampledCount}`);
        }

        console.log('\n\n=== MIGRATION SUMMARY ===');
        const totalClicks = await Click.countDocuments({});
        const clicksWithIsSampled = await Click.countDocuments({ isSampled: { $exists: true } });
        const sampledClicks = await Click.countDocuments({ isSampled: true });
        
        console.log(`Total clicks in database: ${totalClicks}`);
        console.log(`Clicks with isSampled field: ${clicksWithIsSampled}`);
        console.log(`Clicks marked as sampled: ${sampledClicks}`);
        console.log(`Clicks marked as not sampled: ${clicksWithIsSampled - sampledClicks}`);

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

migrateAllClicks();
