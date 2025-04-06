const { fetchSCData } = require('../../utils/fetchSCData');
const { Vehicle } = require('../../config/database');

async function syncVehicles() {
  console.log('[API SYNC] Syncing vehicles...');
  let created = 0, updated = 0, skipped = 0;

  try {
    const vehicles = await fetchSCData('vehicles');

    if (!Array.isArray(vehicles)) throw new Error('Expected an array of vehicles');

    for (const entry of vehicles) {
      const uuid = entry.uuid?.trim();
      if (!uuid) {
        console.warn(`[SKIPPED] Missing or empty uuid for: "${entry.name}"`);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await Vehicle.upsert({
        uuid,
        name: entry.name,
        link: entry.link,
        updated_at: entry.updated_at,
        version: entry.version,
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced ${vehicles.length} vehicles. Skipped: ${skipped}`);
    return { created, updated, total: vehicles.length, skipped };
  } catch (err) {
    console.error('[API SYNC] Error syncing vehicles:', err);
    throw err;
  }
}

module.exports = { syncVehicles };
