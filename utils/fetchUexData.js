// utils/fetchUexData.js
const fetch = require('node-fetch');

const BASE_URL = 'https://api.uexcorp.space/2.0';

/**
 * Fetch data from a UEX API endpoint.
 * @param {string} endpoint - The endpoint to call, e.g., 'vehicles'
 * @returns {Promise<Array|Object>} - Parsed JSON response
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

    const data = await response.json();

    if (!Array.isArray(data) && typeof data !== 'object') {
      throw new Error('Unexpected response format from UEX API');
    }

    return data;
  } catch (err) {
    console.error(`[UEX FETCH ERROR] ${err.message}`);
    return [];
  }
}

module.exports = {
  fetchUexData
};
