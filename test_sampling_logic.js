require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
const Click = require('./models/Click');
const Conversion = require('./models/Conversion');
const { getAllPublishers } = require('./utils/publisherStore');

// Copy the checkIsSampled function from tracking.js
const checkIsSampled = async (campaign, publisher, source, rawPublisherId) => {
    if (!campaign || !campaign.sampling || campaign.sampling.length === 0) {
        console.log('[Sampling] No rules defined');
        return false;
    }

    const sourceStr = String(source || '');
    const rawPubIdStr = String(rawPublisherId || '');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    console.log(`\n[Sampling] Starting check for camp_id=${campaign.campaignId}, publisher=${rawPubIdStr}, source='${sourceStr}'`);
    console.log(`[Sampling] Found ${campaign.sampling.length} sampling rules`);

    for (const rule of campaign.sampling) {
        console.log(`\n[Sampling] Evaluating Rule: PubID=${rule.publisherId}, Type=${rule.subIdsType}, Value=${rule.samplingValue}, SamplingType=${rule.samplingType}`);
        
        // 1. Check Publisher Match
        if (rule.publisherId) {
            let match = false;
            const rulePubIdStr = String(rule.publisherId);
            
            console.log(`  - Rule requires PubID: ${rulePubIdStr}`);
            console.log(`  - Conversion has PubID: ${rawPubIdStr}`);

            if (publisher) {
                if (publisher.id && String(publisher.id) === rulePubIdStr) match = true;
                if (publisher._id && publisher._id.toString() === rulePubIdStr) match = true;
                if (publisher.referenceId && String(publisher.referenceId) === rulePubIdStr) match = true;
                console.log(`  - Publisher object match: ${match}`);
            }
            
            if (!match && rawPubIdStr === rulePubIdStr) {
                match = true;
                console.log(`  - Raw ID match: true`);
            }
            
            if (!match) {
                console.log(`  - ✗ Publisher mismatch, skipping rule`);
                continue;
            }
            console.log(`  - ✓ Publisher matched`);
        }

        // 2. Check Sub ID (Source) Match
        let subIdMatch = false;
        const ruleSubIds = (rule.subIds || []).map(s => String(s).trim());

        console.log(`  - SubIdsType: ${rule.subIdsType}`);
        if (rule.subIdsType === 'All') {
            subIdMatch = true;
            console.log(`  - ✓ SubID match: All`);
        } else if (rule.subIdsType === 'Include') {
            if (ruleSubIds.includes(sourceStr)) subIdMatch = true;
            console.log(`  - SubID Include check: ${subIdMatch}`);
        } else if (rule.subIdsType === 'Exclude') {
            if (!ruleSubIds.includes(sourceStr)) subIdMatch = true;
            console.log(`  - SubID Exclude check: ${subIdMatch}`);
        }

        if (!subIdMatch) {
            console.log(`  - ✗ SubID mismatch, skipping rule`);
            continue;
        }

        // 3. Apply Sampling Logic
        const samplingType = rule.samplingType || 'percentage';
        const threshold = parseFloat(rule.samplingValue) || 0;

        console.log(`  - Sampling Type: ${samplingType}`);
        console.log(`  - Threshold: ${threshold}`);

        if (samplingType === 'fixed') {
            const query = {
                camp_id: campaign.campaignId,
                status: 'sampled',
                createdAt: { $gte: startOfDay }
            };
            
            if (rule.publisherId) {
                query.publisher_id = rawPubIdStr;
            }

            const currentSampledCount = await Conversion.countDocuments(query);
            console.log(`  - Fixed: Current=${currentSampledCount}, Limit=${threshold}`);

            if (currentSampledCount < threshold) {
                console.log(`  - ✓✓✓ SAMPLING (Fixed limit not reached)`);
                return true;
            } else {
                console.log(`  - ✗ Fixed limit reached`);
                return false;
            }
        } else {
            // Percentage
            const randomVal = Math.random() * 100;
            console.log(`  - Random: ${randomVal.toFixed(2)} < ${threshold}?`);
            
            if (randomVal < threshold) {
                console.log(`  - ✓✓✓ SAMPLING (Random hit)`);
                return true;
            } else {
                console.log(`  - ✗ Random miss`);
                return false;
            }
        }
    }

    console.log('\n[Sampling] No rules matched or triggered');
    return false;
};

async function testSampling() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('===== TESTING SAMPLING LOGIC =====\n');

        // Get campaign 11
        const campaign = await Campaign.findOne({ campaignId: 11 });
        if (!campaign) {
            console.log('Campaign 11 not found');
            return;
        }

        console.log('Campaign:', campaign.title);
        console.log('Campaign ID:', campaign.campaignId);

        // Get publisher 2
        const allPublishers = await getAllPublishers();
        const publisher = allPublishers.find(p => p.id == 2 || p.publisherId == 2 || p.referenceId == 2);
        
        console.log('Publisher:', publisher ? publisher.fullName : 'NOT FOUND');

        // Test the sampling function
        const publisher_id = '2';
        const source = '';
        
        const result = await checkIsSampled(campaign, publisher, source, publisher_id);
        
        console.log('\n\n===== FINAL RESULT =====');
        console.log('Should be sampled?', result);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

testSampling();
