const mongoose = require('mongoose');
const Conversion = require('./models/Conversion');
const Campaign = require('./models/Campaign');

async function fixPayouts() {
    try {
        await mongoose.connect('mongodb+srv://sonu8745075525_db_user:AiwTR0w5tawVQXMM@cluster0.ph03yin.mongodb.net/');
        console.log('Connected to DB');
        
        const conversions = await Conversion.find({ payout: 0, status: 'approved' });
        console.log(`Found ${conversions.length} conversions with 0 payout`);
        
        let updatedCount = 0;
        const campaignCache = new Map();

        for (const conv of conversions) {
            let campaign = campaignCache.get(conv.camp_id);
            if (!campaign) {
                // Try finding by _id or campaignId
                if (mongoose.Types.ObjectId.isValid(conv.camp_id)) {
                    campaign = await Campaign.findById(conv.camp_id);
                }
                if (!campaign) {
                    campaign = await Campaign.findOne({ campaignId: Number(conv.camp_id) });
                }
                if (campaign) campaignCache.set(conv.camp_id, campaign);
            }

            if (!campaign || !campaign.payouts || campaign.payouts.length === 0) continue;

            const targetGoal = (conv.goal_name || 'Gross Conversions').toLowerCase().trim();
            const isGross = targetGoal === 'gross conversions' || targetGoal === '';

            // Matching logic (copied from tracking.js)
            const rules = campaign.payouts;
            let rule = null;

            // Try 1: Specific Pub + Specific Goal
            rule = rules.find(r => String(r.publisherId) === String(conv.publisher_id) && r.goalName.toLowerCase().trim() === targetGoal && !isGross);
            
            // Try 2: Specific Pub + Gross Conversions
            if (!rule) rule = rules.find(r => String(r.publisherId) === String(conv.publisher_id) && (r.goalName.toLowerCase().trim() === 'gross conversions' || r.goalName === ''));
            
            // Try 3: All Pubs + Specific Goal
            if (!rule) rule = rules.find(r => (!r.publisherId || r.publisherId === '') && r.goalName.toLowerCase().trim() === targetGoal && !isGross);
            
            // Try 4: All Pubs + Gross Conversions
            if (!rule) rule = rules.find(r => (!r.publisherId || r.publisherId === '') && (r.goalName.toLowerCase().trim() === 'gross conversions' || r.goalName === ''));

            if (rule) {
                let finalPayout = 0;
                if (rule.payoutType === 'fixed') {
                    finalPayout = rule.payoutValue;
                } else {
                    // Percentage - we don't have advertiser payout recorded in Conversion model, 
                    // so we might have to skip or assume 0 if not available.
                    // Actually, if it's 0, it stays 0.
                    finalPayout = 0; 
                }

                if (finalPayout > 0) {
                    conv.payout = finalPayout;
                    await conv.save();
                    updatedCount++;
                    if (updatedCount % 100 === 0) console.log(`Updated ${updatedCount} conversions...`);
                }
            }
        }

        console.log(`Finished! Updated ${updatedCount} conversions.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixPayouts();
