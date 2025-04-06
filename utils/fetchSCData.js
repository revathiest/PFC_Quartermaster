// utils/fetchSCData.js
const fetch = require('node-fetch');

const BASE_URL = 'https://api.star-citizen.wiki/api/v2';
const DEFAULT_LIMIT = 50;

async function fetchSCData(endpoint, queryparams = {}) {
  try {
    const allData = [];
    let page = 1;
    let hasNext = true;

    // Always start with limit=50 unless caller specifies something else
    const limit = queryparams.limit || DEFAULT_LIMIT;

    console.log(`[FETCH DEBUG] Starting fetch for endpoint: ${endpoint}`);
    console.log(`[FETCH DEBUG] Using limit: ${limit}`);

    while (hasNext) {
      const params = new URLSearchParams({
        ...queryparams,
        limit,
        page,
      });

      const url = `${BASE_URL}/${endpoint}?${params.toString()}`;
      console.log(`[FETCH DEBUG] Fetching page ${page} -> ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        console.error(`[FETCH ERROR] HTTP error on page ${page}: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch page ${page}`);
      }

      const json = await response.json();
      console.log(`[FETCH DEBUG] Page ${page} returned ${json.data?.length ?? 0} items`);

      if (!Array.isArray(json.data)) {
        console.error(`[FETCH ERROR] Data format issue on page ${page}: Expected array, got ${typeof json.data}`);
        throw new Error(`Expected array in 'data'`);
      }

      allData.push(...json.data);

      hasNext = json.links?.next !== null;
      console.log(`[FETCH DEBUG] Has next page? ${hasNext}`);
      page++;
    }

    console.log(`[FETCH DEBUG] Finished fetching ${allData.length} items from ${endpoint}`);
    return allData;

  } catch (err) {
    console.error(`[FETCH ERROR] ${err.message}`);
    return [];
  }
}

module.exports = { fetchSCData };
