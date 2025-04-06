const fetchFromAPI = require('../fetchSCData');
const { Manufacturer } = require('../../config/database');

async function syncManufacturers() {
  console.log('[API SYNC] Syncing manufacturers...');

  try {
    const data = await fetchFromAPI('manufacturers');
    if (!Array.isArray(data)) throw new Error('Expected an array of manufacturers');

    for (const entry of data) {
      await Manufacturer.upsert({
        uuid: entry.uuid,
        code: entry.code,
        name: entry.name,
        description: entry.description,
        logo: entry.media?.logo
      });
    }

    console.log(`[API SYNC] Synced ${data.length} manufacturers.`);
  } catch (err) {
    console.error('[API SYNC] Error syncing manufacturers:', err);
  }
}

module.exports = { syncManufacturers };
