const mongoose = require('mongoose');
require('dotenv').config();

const Click = require('./models/Click');
const Campaign = require('./models/Campaign');

async function fixCampaign13() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const campaign = await Campaign.findOne({ campaignId: 13 });
        
        if (!campaign) {
            console.log('Campaign 13 not found');
            return;
        }

        console.log(`Campaign: ${campaign.title}`);
        console.log(`Settings: ${JSON.stringify(campaign.clicksSettings, null, 2)}`);

        // Force use the first rule if it exists
        const rule = campaign.clicksSettings?.[0];
        
        if (!rule) {
            console.log('No settings found on campaign 13');
            return;
        }

        const cutoffValue = parseFloat(rule.value);
        const cutoffType = rule.cutoffType || 'percentage';
        
        console.log(`Applying Rule: ${cutoffValue} ${cutoffType}`);

        // Get clicks specifically for campaign 13
        const clicks = await Click.find({ camp_id: '13' }).sort({ timestamp: 1 });
        console.log(`Total clicks: ${clicks.length}`);

        let sampledCount = 0;
        
        if (cutoffType === 'percentage') {
            // Logic: if 50%, then 50% of clicks should be sampled.
            // Let's mark the LAST N clicks as sampled to be safe, or distributed.
            // Simplified: Mark every Nth click? Or just the last chunk?
            // The previous script tried to mark the *last* chunk.
            
            const targetSampledCount = Math.round(clicks.length * (cutoffValue / 100));
            console.log(`Target Sampled: ${targetSampledCount} (${cutoffValue}%)`);

            // Mark the LAST targetSampledCount clicks as sampled
            // This simulates them hitting the limit later in the day
            for (let i = 0; i < clicks.length; i++) {
                const click = clicks[i];
                // If we have 17 clicks and want 9 sampled (approx 50%), 
                // index 0..7 (8 clicks) are NOT sampled
                // index 8..16 (9 clicks) are sampled
                
                // 17 - 9 = 8. So indices >= 8 are sampled.
                const thresholdIndex = clicks.length - targetSampledCount;
                const shouldBeSampled = i >= thresholdIndex;

                if (shouldBeSampled !== click.isSampled) {
                    await Click.updateOne(
                        { _id: click._id },
                        { $set: { isSampled: shouldBeSampled } }
                    );
                    if (shouldBeSampled) sampledCount++;
                } else {
                    if (shouldBeSampled) sampledCount++;
                }
            }
        } else {
            // Count based
            // First N clicks are NOT sampled (they are allowed)
            // Anything after N is sampled
            const limit = cutoffValue;
            console.log(`Limit: ${limit} clicks allowed`);
            
            for (let i = 0; i < clicks.length; i++) {
                const click = clicks[i];
                const shouldBeSampled = i >= limit;

                if (shouldBeSampled !== click.isSampled) {
                     await Click.updateOne(
                        { _id: click._id },
                        { $set: { isSampled: shouldBeSampled } }
                    );
                }
                if (shouldBeSampled) sampledCount++;
            }
        }

        console.log(`\nFixed! Now ${sampledCount} clicks are marked as sampled.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

fixCampaign13();
