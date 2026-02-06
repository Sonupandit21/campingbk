const axios = require('axios');
const mongoose = require('mongoose');
const Click = require('./models/Click');
const Conversion = require('./models/Conversion');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001'; 

async function testTracking() {
    console.log('--- START TRACKING TEST (v2) ---');

    console.log('1. Testing Click Tracking at /api/track ...');
    try {
        const res = await axios.get(`${BASE_URL}/api/track?camp_id=1&source=test_script_v2`, {
            maxRedirects: 0, // catch redirect
            validateStatus: status => status >= 200 && status < 400
        });
        console.log(`Click request status: ${res.status}`);
        if (res.headers.location) {
            console.log(`Redirected to: ${res.headers.location}`);
        }
    } catch (e) {
        console.error('Click request failed:', e.message);
        if (e.response) console.log('Response:', e.response.status, e.response.data);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check for recent click
    const latestClick = await Click.findOne({ source: 'test_script_v2' }).sort({ createdAt: -1 });
    if (latestClick) {
        console.log('SUCCESS: Click found in DB!');
        console.log(`Click ID: ${latestClick.click_id}`);

        console.log('2. Testing Conversion Postback at /api/track/conversion ...');
        try {
            const convRes = await axios.get(`${BASE_URL}/api/track/conversion`, {
                params: {
                    click_id: latestClick.click_id,
                    payout: 1.50
                }
            });
            console.log(`Conversion response: ${convRes.status}`, convRes.data);
            
            const latestConv = await Conversion.findOne({ click_id: latestClick.click_id });
            if (latestConv) {
                console.log('SUCCESS: Conversion found in DB!');
            } else {
                console.error('FAILURE: Conversion NOT found in DB.');
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
