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

    while (hasNext) {
      const params = new URLSearchParams({
        ...queryparams,
        limit,
        page,
      });

      const url = `${BASE_URL}/${endpoint}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`Failed to fetch page ${page}: ${response.statusText}`);
      const json = await response.json();

      if (!Array.isArray(json.data)) throw new Error(`Expected array in 'data', got ${typeof json.data}`);

      allData.push(...json.data);

      hasNext = json.links?.next !== null;
      page++;
    }

    return allData;
  } catch (err) {
    console.error(`[FETCH ERROR] ${err.message}`);
    return [];
  }
}

module.exports = { fetchSCData };
