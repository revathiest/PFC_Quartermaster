const fetch = require('isomorphic-unfetch');

const BASE_URL = 'https://api.star-citizen.wiki/api/v2/';

/**
 * Fetch data from a specific Star Citizen API endpoint.
 * @param {string} endpoint - The endpoint to fetch from (e.g., 'armor', 'vehicles').
 * @returns {Promise<Object>} The parsed JSON data from the API.
 */
async function fetchSCData(endpoint) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[SC API] Error fetching ${endpoint}:`, error.message);
    throw error;
  }
}

module.exports = { fetchSCData };
