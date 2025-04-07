const { fetchSCData } = require('../../utils/fetchSCData');
const { Shop } = require('../../config/database');

async function syncShops() {
  console.log('[API SYNC] Syncing shops...');
  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const shops = await fetchSCData('shops');

    for (const entry of shops) {
      if (!entry.uuid) {
        console.warn(`[SKIPPED] Missing UUID for shop "${entry.name}"`);
        skipped++;
        continue;
      }

      const [shop, wasCreated] = await Shop.upsert({
        uuid: entry.uuid,
        name_raw: entry.name_raw || null,
        name: entry.name,
        position: entry.position || null,
        profit_margin: entry.profit_margin ?? null,
        link: entry.link,
        version: entry.version
      });

      wasCreated ? created++ : updated++;
    }

    return { created, updated, skipped, total: shops.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing shops:', err);
    throw err;
  }
}

module.exports = { syncShops };
