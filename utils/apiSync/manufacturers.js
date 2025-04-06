const { fetchSCData } = require('../fetchSCData');
const { Manufacturer } = require('../../config/database');

async function syncManufacturers() {
  console.log('[API SYNC] Syncing manufacturers...');

  try {
    const response = await fetchSCData('manufacturers');
    const data = response.data;

    if (!Array.isArray(data)) {
      throw new Error('Expected an array of manufacturers');
    }

    for (const entry of data) {
      await Manufacturer.upsert({
        code: entry.code,       // Acts as unique identifier
        name: entry.name,
        link: entry.link
      });
    }

    console.log(`[API SYNC] Synced ${data.length} manufacturers.`);
    return { created: data.length, updated: 0 }; // Placeholder until we track diffs
  } catch (err) {
    console.error('[API SYNC] Error syncing manufacturers:', err);
    throw err;
  }
}

module.exports = { syncManufacturers };
