const fetch = require('node-fetch');

const BASE_URL = 'https://api.uexcorp.space/2.0';

/**
 * Fetches raw JSON from a UEX API endpoint.
 * Does NOT automatically extract `.data` to give flexibility.
 * 
 * @param {string} endpoint - Endpoint to hit (e.g. 'vehicles', 'ships/123')
 * @returns {Promise<Object>} - The full JSON response from the UEX API
 */
async function fetchUexData(endpoint) {
  try {
    const url = `${BASE_URL}/${endpoint}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.UEX_API_TOKEN}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    console.log(`[UEX FETCH] ${endpoint} response:`, JSON.stringify(json, null, 2)); // 💡 Optional: comment this out later

    return json;

  } catch (err) {
    console.error(`[UEX FETCH ERROR] ${err.message}`);
    return {};
  }
}

module.exports = {
  fetchUexData
};
