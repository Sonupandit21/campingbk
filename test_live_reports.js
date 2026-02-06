const axios = require('axios');

const URL = 'https://campingbk.onrender.com/api/reports?startDate=2026-01-30&endDate=2026-02-06';

async function testLive() {
    console.log(`Testing Live URL: ${URL}`);
    try {
        const res = await axios.get(URL);
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Request Failed!');
        console.error('Status:', e.response ? e.response.status : 'Unknown');
        if (e.response && e.response.data) {
            console.log('Error Details:', JSON.stringify(e.response.data, null, 2));
            // Try to log the cast error value explicitly if nested
            if (e.response.data.details && e.response.data.details.value) {
                console.log('FAILING VALUE:', e.response.data.details.value);
            }
        } else {
            console.error('Error Message:', e.message);
        }
    }
}

testLive();
