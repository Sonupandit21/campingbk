// Simulate the EXACT logic from tracking.js
require('dotenv').config();
const mongoose = require('mongoose');
const Publisher = require('./models/Publisher');
const Campaign = require('./models/Campaign');

// --- COPIED FUNCTIONS START ---
// Get all publishers (Mocked or from DB)
async function getAllPublishers() {
  const publishers = await Publisher.find().sort({ publisherId: 1 });
  return publishers.map(p => ({
    ...p.toObject(),
    id: p.publisherId || p._id.toString() 
  }));
}

const Conversion = require('./models/Conversion'); // Needed for fixed logic

const checkIsSampled = async (campaign, publisher, source) => {
    if (!campaign || !campaign.sampling || campaign.sampling.length === 0) return false;

    // Normalize inputs
    const sourceStr = String(source || '');
    const rawPubIdStr = String(publisher ? publisher.id : '');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (const rule of campaign.sampling) {
        // 1. Check Publisher Match
        if (rule.publisherId) {
            let match = false;
            const rulePubIdStr = String(rule.publisherId);
            
            console.log(`[Sampling] Checking Rule PubID: ${rulePubIdStr} vs Conversion Pub:`, rawPubIdStr);

            if (rawPubIdStr === rulePubIdStr) match = true;
            
            if (!match) continue; 
        }

        // 2. Check Sub ID (Source) Match
        let subIdMatch = false;
        const ruleSubIds = (rule.subIds || []).map(s => String(s).trim());

        if (rule.subIdsType === 'All') {
            subIdMatch = true;
        } else if (rule.subIdsType === 'Include') {
            if (ruleSubIds.includes(sourceStr)) subIdMatch = true;
        } else if (rule.subIdsType === 'Exclude') {
            if (!ruleSubIds.includes(sourceStr)) subIdMatch = true;
        }

        if (!subIdMatch) continue;

        // 4. Apply Sampling
        const samplingType = rule.samplingType || 'percentage';
        const threshold = parseFloat(rule.samplingValue) || 0;

        if (samplingType === 'fixed') {
             const query = {
                 camp_id: campaign.campaignId, 
                 status: 'sampled',
                 createdAt: { $gte: startOfDay }
             };
             if (rule.publisherId) query.publisher_id = rawPubIdStr; 

             const currentSampledCount = await Conversion.countDocuments(query);
             console.log(`[Sampling] Fixed Check: Limit=${threshold}, Current=${currentSampledCount}`);

             if (currentSampledCount < threshold) {
                 return true; 
             } else {
                 return false;
             }

        } else {
            const randomVal = Math.random() * 100;
            if (randomVal < threshold) {
                console.log(`[Sampling] HIT: Rule matched (Val: ${threshold}%)`);
                return true; 
            } else {
                return false;
            }
        }
    }
    return false; 
};
// --- COPIED FUNCTIONS END ---

async function simulate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Setup inputs based on finding (Latest Conv was Approved)
        // Need to fetch valid IDs from DB
        const camp = await Campaign.findOne({ campaignId: 11 });
        if(!camp) { console.log('No campaign found with ID 11'); return; }

        console.log(`Original Sampling:`, JSON.stringify(camp.sampling));

        // MOCK SAMPLING RULE FOR TEST
        camp.sampling = [{
            publisherId: "2",
            samplingType: "fixed",
            samplingValue: 0, // Zero limit -> Should MISS (return false) if count >= 0
             subIdsType: "All"
        }];
        console.log(`Mocked Sampling:`, JSON.stringify(camp.sampling));
        
        // Assume conversion had this Pub ID:
        const pubIdFromConv = "2"; 
        const source = ""; 
        
        console.log(`\n--- SIMULATION ---`);
        console.log(`Campaign: ${camp.title}`);
        console.log(`Target Pub ID: ${pubIdFromConv}`);
        
        // 1. Fetch Publisher Logic (mimic handleConversion)
        let publisherObj = null;
        if (pubIdFromConv) {
             publisherObj = { id: pubIdFromConv }; // Mock object
        }
        
        console.log(`Resolved Publisher Object:`, publisherObj ? `ID: ${publisherObj.id}` : 'NULL');

        // 2. Check Sampling
        const result = await checkIsSampled(camp, publisherObj, source);
        console.log(`\nRESULT: isSampled = ${result}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

simulate();
