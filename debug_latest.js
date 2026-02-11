require('dotenv').config();
const mongoose = require('mongoose');
const Conversion = require('./models/Conversion');
const Campaign = require('./models/Campaign');

async function debugLatest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Get Last Conversion
        const lastConv = await Conversion.findOne().sort({ createdAt: -1 });
        if (!lastConv) {
            console.log('No conversions found.');
            return;
        }

        console.log('--- LATEST CONVERSION ---');
        console.log(`ClickID: ${lastConv.click_id}`);
        console.log(`PubID: ${lastConv.publisher_id}`);
        console.log(`CampID: ${lastConv.camp_id}`);
        console.log(`Source: ${lastConv.source}`);
        console.log(`Status: ${lastConv.status}  <-- CHECK THIS`);
        console.log(`Created: ${lastConv.createdAt}`);

        // Get Campaign and Rules
        const campaign = await Campaign.findOne({ campaignId: lastConv.camp_id });
        if (campaign) {
            console.log('\n--- CAMPAIGN RULES ---');
            console.log(`Title: ${campaign.title}`);
            console.log('Rules:', JSON.stringify(campaign.sampling, null, 2));

            // dry-run logic
            if (campaign.sampling) {
                campaign.sampling.forEach((rule, i) => {
                    const rulePubIdStr = String(rule.publisherId);
                    
                    let idMatch = false;
                    // Simulate the robust check
                    if (String(lastConv.publisher_id) === rulePubIdStr) idMatch = true;
                    // We can't access lastConv.publisher object here, but we can assume ID match logic works if strings match
                    
                    console.log(`Rule ${i} ID Match: ${idMatch} ('${lastConv.publisher_id}' vs '${rulePubIdStr}')`);
                    
                    const val = parseFloat(rule.samplingValue);
                    console.log(`Rule ${i} Value: ${rule.samplingValue} (Parsed: ${val})`);

                    // Check SubIds
                    let subIdMatch = false;
                    const sourceStr = String(lastConv.source || '');
                    const ruleSubIds = (rule.subIds || []).map(s => String(s).trim());
                    
                    if (rule.subIdsType === 'All') subIdMatch = true;
                    else if (rule.subIdsType === 'Include' && ruleSubIds.includes(sourceStr)) subIdMatch = true;
                    else if (rule.subIdsType === 'Exclude' && !ruleSubIds.includes(sourceStr)) subIdMatch = true;
                    
                    console.log(`Rule ${i} SubID Match: ${subIdMatch} (Type: ${rule.subIdsType}, Source: '${sourceStr}')`);
                });
            }
        } else {
            console.log('\nCampaign not found for this conversion.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debugLatest();
