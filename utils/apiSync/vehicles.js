const { fetchSCData } = require('../../utils/fetchSCData');
const { Vehicle } = require('../../config/database');

async function syncVehicles() {
  console.log('[API SYNC] Syncing vehicles...');
  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const vehicles = await fetchSCData('vehicles');

    if (!Array.isArray(vehicles)) {
      throw new Error('Expected an array of vehicles');
    }

    for (const entry of vehicles) {
      const uuid = entry.uuid?.trim();

      if (!uuid) {
        console.warn(`[SKIPPED] Missing or empty UUID for: "${entry.name}"`);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await Vehicle.upsert({
        uuid: entry.uuid,
        name: entry.name,
        link: entry.link,
        version: entry.version,
        updated_at: entry.updated_at,
      });

      if (wasCreated) {
        created++;
      } else {
        updated++;
      }
    }

    console.log(`[API SYNC] Synced ${created + updated} vehicles.`);
    return { created, updated, skipped, total: vehicles.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing vehicles:', err);
    throw err;
  }
}

module.exports = { syncVehicles };
