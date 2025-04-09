const { fetchUexData } = require('../utils/fetchUexData');
const { UexVehicle } = require('../../config/database');

async function syncUexVehicles() {
  console.log('[API SYNC] Syncing UEX vehicles...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const vehicles = await fetchUexData('vehicles');

    if (!Array.isArray(vehicles)) {
      throw new Error('Expected an array of vehicles');
    }

    for (const entry of vehicles) {
      if (!entry.id || !entry.name) {
        console.warn(`[SKIPPED] Missing ID or name for vehicle:`, entry);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await UexVehicle.upsert({
        id: entry.id,
        uuid: entry.uuid,
        name: entry.name,
        name_full: entry.name_full,
        slug: entry.slug,
        company_name: entry.company_name,
        crew: entry.crew,
        scu: entry.scu,
        mass: entry.mass,
        width: entry.width,
        height: entry.height,
        length: entry.length,
        fuel_quantum: entry.fuel_quantum,
        fuel_hydrogen: entry.fuel_hydrogen,
        container_sizes: entry.container_sizes,
        pad_type: entry.pad_type,
        game_version: entry.game_version,
        date_added: entry.date_added,
        date_modified: entry.date_modified,
        url_store: entry.url_store,
        url_brochure: entry.url_brochure,
        url_hotsite: entry.url_hotsite,
        url_video: entry.url_video,
        url_photos: JSON.stringify(entry.url_photos),
        is_spaceship: entry.is_spaceship,
        is_ground_vehicle: entry.is_ground_vehicle,
        is_single_pilot: entry.is_single_pilot,
        is_multi_crew: entry.is_multi_crew,
        is_combat: entry.is_combat,
        is_exploration: entry.is_exploration,
        is_industry: entry.is_industry,
        is_cargo: entry.is_cargo,
        is_refinery: entry.is_refinery,
        is_mining: entry.is_mining,
        is_salvage: entry.is_salvage,
        is_transport: entry.is_transport,
        is_medical: entry.is_medical,
        is_racing: entry.is_racing,
        is_touring: entry.is_touring,
        is_data: entry.is_data,
        is_stealth: entry.is_stealth,
        is_military: entry.is_military,
        is_civilian: entry.is_civilian,
        is_personal_transport: entry.is_personal_transport,
        is_vehicle_transport: entry.is_vehicle_transport,
        is_research: entry.is_research,
        is_pathfinder: entry.is_pathfinder,
        is_multirole: entry.is_multirole
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced UEX vehicles - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: vehicles.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing UEX vehicles:', err);
    throw err;
  }
}

module.exports = { syncUexVehicles };
