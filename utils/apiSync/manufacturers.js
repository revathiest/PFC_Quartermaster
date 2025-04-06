const { fetchSCData } = require('../../utils/fetchSCData');
const { Manufacturer } = require('../../config/database');

async function syncManufacturers() {
  console.log('[API SYNC] Syncing manufacturers...');

  try {
    const manufacturers = await fetchSCData('manufacturers');

    if (!Array.isArray(manufacturers)) {
      throw new Error('Expected an array of manufacturers');
    }

    for (const entry of manufacturers) {
      await Manufacturer.upsert({
        code: entry.code,
        name: entry.name,
        link: entry.link,
      });
    }

    return { created: manufacturers.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing manufacturers:', err);
    throw err;
  }
}

module.exports = { syncManufacturers };
