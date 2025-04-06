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

    const code = entry.code?.trim()
    
    let skipped = 0;

    if (!code) {
      console.warn(`[SKIPPED] Missing or empty code for: "${entry.name}"`);
      skipped++;
      continue;
    }

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
