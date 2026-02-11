const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Conversion = require('../models/Conversion');
const auth = require('../middleware/auth');

// Helper function to reprocess conversions based on sampling rules
const reprocessConversions = async (campaignId, samplingRules) => {
    try {
        // Get all conversions for this campaign
        const conversions = await Conversion.find({ 
            camp_id: campaignId.toString() 
        }).sort({ createdAt: 1 });

        console.log(`[Reprocess] Found ${conversions.length} conversions for campaign ${campaignId}`);

        if (!samplingRules || samplingRules.length === 0) {
            // No sampling rules - mark all as approved
            await Conversion.updateMany(
                { camp_id: campaignId.toString() },
                { $set: { status: 'approved' } }
            );
            console.log('[Reprocess] No rules - marked all as approved');
            return;
        }

        // Group conversions by publisher + source for percentage-based sampling
        const groupedConversions = {};
        
        conversions.forEach(conv => {
            const key = `${conv.publisher_id}-${conv.source || ''}`;
            if (!groupedConversions[key]) {
                groupedConversions[key] = [];
            }
            groupedConversions[key].push(conv);
        });

        // Process each group
        for (const [key, convGroup] of Object.entries(groupedConversions)) {
            const [publisherId, source] = key.split('-');
            
            // Find matching rule
            const matchingRule = samplingRules.find(rule => {
                // Check publisher match
                if (rule.publisherId && rule.publisherId !== publisherId) {
                    return false;
                }
                
                // Check source match
                if (rule.subIdsType === 'All') return true;
                if (rule.subIdsType === 'Include') {
                    return rule.subIds && rule.subIds.includes(source);
                }
                if (rule.subIdsType === 'Exclude') {
                    return !rule.subIds || !rule.subIds.includes(source);
                }
                return false;
            });

            if (matchingRule) {
                const samplingType = matchingRule.samplingType || 'percentage';
                const samplingValue = parseFloat(matchingRule.samplingValue) || 0;

                if (samplingType === 'percentage') {
                    // Calculate how many to sample
                    const totalCount = convGroup.length;
                    const sampleCount = Math.floor((totalCount * samplingValue) / 100);
                    
                    console.log(`[Reprocess] Group ${key}: ${totalCount} total, sampling ${sampleCount} (${samplingValue}%)`);
                    
                    // Mark first sampleCount as sampled, rest as approved
                    for (let i = 0; i < convGroup.length; i++) {
                        const newStatus = i < sampleCount ? 'sampled' : 'approved';
                        if (convGroup[i].status !== newStatus) {
                            convGroup[i].status = newStatus;
                            await convGroup[i].save();
                        }
                    }
                } else if (samplingType === 'fixed') {
                    // Fixed: Sample first N conversions per day
                    // Group by day
                    const byDay = {};
                    convGroup.forEach(conv => {
                        const day = conv.createdAt.toISOString().split('T')[0];
                        if (!byDay[day]) byDay[day] = [];
                        byDay[day].push(conv);
                    });

                    // Apply fixed sampling per day
                    for (const dayConvs of Object.values(byDay)) {
                        for (let i = 0; i < dayConvs.length; i++) {
                            const newStatus = i < samplingValue ? 'sampled' : 'approved';
                            if (dayConvs[i].status !== newStatus) {
                                dayConvs[i].status = newStatus;
                                await dayConvs[i].save();
                            }
                        }
                    }
                }
            } else {
                // No rule matches - mark as approved
                for (const conv of convGroup) {
                    if (conv.status !== 'approved') {
                        conv.status = 'approved';
                        await conv.save();
                    }
                }
            }
        }

        console.log('[Reprocess] Completed successfully');
    } catch (error) {
        console.error('[Reprocess] Error:', error);
        throw error;
    }
};

// Endpoint to reprocess conversions
router.post('/:id/reprocess-sampling', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Check authorization
        if (req.user.role !== 'admin' && campaign.created_by.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await reprocessConversions(campaign.campaignId, campaign.sampling);

        res.json({ success: true, message: 'Conversions reprocessed successfully' });
    } catch (error) {
        console.error('Error reprocessing conversions:', error);
        res.status(500).json({ error: 'Failed to reprocess conversions' });
    }
});

module.exports = { router, reprocessConversions };
