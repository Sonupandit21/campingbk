const axios = require('axios');
const mongoose = require('mongoose');
const Click = require('./models/Click');
const Conversion = require('./models/Conversion');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001'; // Adjust if needed

async function testTracking() {
    console.log('--- START TRACKING TEST ---');

    console.log('1. Testing Click Tracking...');
    try {
        // Camp ID 1 is known to exist/be valid from check_campaigns.js
        const res = await axios.get(`${BASE_URL}/tracking?camp_id=1&source=test_script`, {
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400
        });
        console.log(`Click request status: ${res.status}`);
        if (res.headers.location) {
            console.log(`Redirected to: ${res.headers.location}`);
        }
    } catch (e) {
        console.error('Click request failed or no redirect:', e.message);
    }

    // Connect to DB to verify
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check for recent click
    const latestClick = await Click.findOne({ source: 'test_script' }).sort({ createdAt: -1 });
    if (latestClick) {
        console.log('SUCCESS: Click found in DB!');
        console.log(`Click ID: ${latestClick.click_id}`);

        console.log('2. Testing Conversion Postback...');
        try {
            const convRes = await axios.get(`${BASE_URL}/tracking/conversion`, {
                params: {
                    click_id: latestClick.click_id,
                    payout: 1.50,
                    camp_id: 1 // usually optional as it looks up click, but passing just in case
                }
            });
            console.log(`Conversion response: ${convRes.status}`, convRes.data);
            
            // Verify Conversion
            const latestConv = await Conversion.findOne({ click_id: latestClick.click_id });
            if (latestConv) {
                console.log('SUCCESS: Conversion found in DB!');
                console.log('Data:', latestConv);
            } else {
                console.error('FAILURE: Conversion NOT found in DB despite 200 OK.');
            }

        } catch (e) {
            console.error('Conversion request failed:', e.message);
            if (e.response) console.error('Response:', e.response.data);
        }

    } else {
        console.error('FAILURE: Click NOT found within DB.');
    }

    console.log('--- END TRACKING TEST ---');
    process.exit();
}

testTracking();
