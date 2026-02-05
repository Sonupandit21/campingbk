const fetch = require('node-fetch'); // Ensure node-fetch is available or use global fetch in Node 18+

const TRACKIER_BASE_URL = 'https://jjkjdnc.trackier.co/acquisition';

/**
 * Fire S2S Postback to Trackier
 * @param {string} click_id - The click ID to convert
 * @param {string|number} payout - Conversion payout amount
 * @returns {Promise<boolean>} - True if successful
 */
const fireTrackierPostback = async (click_id, payout) => {
    const securityToken = process.env.TRACKIER_SECURITY_TOKEN;
    
    if (!securityToken) {
        console.error('[Trackier] Missing TRACKIER_SECURITY_TOKEN in env');
        return false;
    }

    // Construct URL
    const url = new URL(TRACKIER_BASE_URL);
    url.searchParams.append('click_id', click_id);
    url.searchParams.append('security_token', securityToken);
    if (payout) {
        url.searchParams.append('payout', payout); // passed as 'sale_amount' or 'payout'? Prompt said 'payout'
        url.searchParams.append('sale_amount', payout); // Often required as sale_amount too, let's add both or just payout as per prompt. Prompt said "with click_id, security_token, and payout."
    }

    const maxRetries = 3;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`[Trackier] Firing postback (Attempt ${i+1}): ${url.toString()}`);
            const response = await fetch(url.toString());
            
            if (response.ok) {
                console.log(`[Trackier] Postback successful: ${await response.text()}`);
                return true;
            } else {
                console.warn(`[Trackier] Failed status: ${response.status} - ${await response.text()}`);
            }
        } catch (err) {
            console.error(`[Trackier] Error: ${err.message}`);
        }
        
        // Wait 1s before retry
        if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1000));
    }
    
    return false;
};

module.exports = { fireTrackierPostback };
