const mongoose = require('mongoose');
require('dotenv').config();
const Campaign = require('./models/Campaign');
const Click = require('./models/Click');

// Mock function to simulate checkClicksCutoff logic
const checkClicksCutoffMock = (rule, clickCount, uniqueCount) => {
    const cutoffValue = parseFloat(rule.value) || 0;
    const cutoffTypeMode = rule.cutoffType || 'percentage';
    const clickType = rule.type || 'Clicks';

    if (cutoffTypeMode === 'percentage') {
        const hits = [];
        for (let i = 0; i < 1000; i++) {
            if (Math.random() * 100 < cutoffValue) hits.push(true);
        }
        return hits.length; // Return number of hits out of 1000
    } else {
        if (clickType === 'Clicks') {
            return clickCount >= cutoffValue;
        }
    }
    return false;
};

async function verifySampling() {
    console.log('Testing Percentage Logic (60%):');
    const rule = { cutoffType: 'percentage', value: 60 };
    const hits = checkClicksCutoffMock(rule);
    console.log(`Hits in 1000 trials: ${hits} (Expected ~600)`);

    console.log('\nTesting Fixed Count Logic (10 clicks limit):');
    const fixedRule = { cutoffType: 'count', value: 10, type: 'Clicks' };
    console.log(`At 9 clicks: ${checkClicksCutoffMock(fixedRule, 9)}`);
    console.log(`At 10 clicks: ${checkClicksCutoffMock(fixedRule, 10)}`);
    console.log(`At 11 clicks: ${checkClicksCutoffMock(fixedRule, 11)}`);

    process.exit(0);
}

verifySampling();
