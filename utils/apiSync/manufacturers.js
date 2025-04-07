const { fetchSCData } = require('../../utils/fetchSCData');
const { Manufacturer } = require('../../config/database');

async function syncManufacturers() {
  console.log('[API SYNC] Syncing manufacturers...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const manufacturers = await fetchSCData('manufacturers');

    if (!Array.isArray(manufacturers)) {
      throw new Error('Expected an array of manufacturers');
    }

    for (const entry of manufacturers) {
      const code = entry.code?.trim();

      if (!code) {
        console.warn(`[SKIPPED] Missing or empty code for: "${entry.name}"`);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await Manufacturer.upsert({
        code,
        name: entry.name,
        link: entry.link,
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced manufacturers - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: manufacturers.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing manufacturers:', err);
    throw err;
  }
}

module.exports = { syncManufacturers };
