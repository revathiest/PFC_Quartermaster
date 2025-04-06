// utils/fetchSCData.js
const fetch = require('node-fetch');

const BASE_URL = 'https://api.star-citizen.wiki/api/v2';
const MAX_LIMIT = 50;

async function fetchSCData(endpoint, queryparams = {}) {
  try {
    // Get total count from the first request
    const params = new URLSearchParams({ ...queryparams, limit: 1 }).toString();
    const firstUrl = `${BASE_URL}/${endpoint}?${params}`;
    const initialResponse = await fetch(firstUrl);
    if (!initialResponse.ok) throw new Error(`Initial fetch failed: ${initialResponse.statusText}`);

    const initialJson = await initialResponse.json();
    const total = initialJson?.meta?.total;
    if (!total || typeof total !== 'number') throw new Error('Unable to determine total count');

    const pages = Math.ceil(total / MAX_LIMIT);
    const results = [];

    for (let page = 1; page <= pages; page++) {
      const pagedParams = new URLSearchParams({ ...queryparams, limit: MAX_LIMIT, page }).toString();
      const pageUrl = `${BASE_URL}/${endpoint}?${pagedParams}`;
      const res = await fetch(pageUrl);
      if (!res.ok) throw new Error(`Page ${page} fetch failed: ${res.statusText}`);
      const json = await res.json();

      if (Array.isArray(json.data)) {
        results.push(...json.data);
      } else {
        console.warn(`[FETCH WARN] Page ${page} returned unexpected data format`);
      }
    }

    return results;

  } catch (err) {
    console.error(`[FETCH ERROR] ${err.message}`);
    return [];
  }
}

module.exports = { fetchSCData };
