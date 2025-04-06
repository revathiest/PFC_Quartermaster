// utils/fetchSCData.js
const fetch = require('node-fetch');

const BASE_URL = 'https://api.star-citizen.wiki/api/v2';

async function fetchSCData(endpoint) {
  try {
    // First request to get total number of items
    const firstResponse = await fetch(`${BASE_URL}/${endpoint}`);
    if (!firstResponse.ok) throw new Error(`Initial fetch failed: ${firstResponse.statusText}`);

    const initialJson = await firstResponse.json();
    const total = initialJson?.meta?.total;

    if (!total || typeof total !== 'number') {
      throw new Error('Unable to determine total number of items from response');
    }

    // Second request with the full limit
    const fullResponse = await fetch(`${BASE_URL}/${endpoint}?limit=${total}`);
    if (!fullResponse.ok) throw new Error(`Full fetch failed: ${fullResponse.statusText}`);

    const fullJson = await fullResponse.json();

    if (!Array.isArray(fullJson.data)) {
      throw new Error(`Expected array in 'data', got ${typeof fullJson.data}`);
    }

    return fullJson.data;
  } catch (err) {
    console.error(`[FETCH ERROR] ${err.message}`);
    return [];
  }
}

module.exports = { fetchSCData };
