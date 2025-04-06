// utils/fetchSCData.js
const fetch = require('node-fetch');

const BASE_URL = 'https://api.star-citizen.wiki/api/v2';

async function fetchSCData(endpoint, queryparams = {}) {
  try {
    // Build the first request URL with limit=1 if no limit provided
    const initialParams = new URLSearchParams({
      ...queryparams,
      ...(queryparams.limit ? {} : { limit: 1 })
    }).toString();

    const initialUrl = `${BASE_URL}/${endpoint}${initialParams ? `?${initialParams}` : ''}`;

    console.log(initialUrl);

    const firstResponse = await fetch(initialUrl);
    if (!firstResponse.ok) throw new Error(`Initial fetch failed: ${firstResponse.statusText}`);

    const initialJson = await firstResponse.json();
    const total = initialJson?.meta?.total;

    if (!total || typeof total !== 'number') {
      throw new Error('Unable to determine total number of items from response');
    }

    // Build the second request URL with limit=total
    const finalParams = new URLSearchParams({ ...queryparams, limit: total }).toString();
    const fullUrl = `${BASE_URL}/${endpoint}?${finalParams}`;

    const fullResponse = await fetch(fullUrl);
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
