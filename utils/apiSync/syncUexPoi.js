const { fetchUexData } = require('../fetchUexData');
const { UexPoi } = require('../../config/database');

async function syncUexPois() {
  console.log('[API SYNC] Syncing UEX POIs...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const response = await fetchUexData('poi');
    const pois = response?.data;

    if (!Array.isArray(pois)) {
      throw new Error('Expected an array of POIs');
    }

    for (const entry of pois) {
      if (!entry.id || !entry.name) {
        console.warn('[SKIPPED] Missing ID or name for POI:', entry);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await UexPoi.upsert({
        id: entry.id,
        id_star_system: entry.id_star_system,
        id_planet: entry.id_planet,
        id_orbit: entry.id_orbit,
        id_moon: entry.id_moon,
        id_space_station: entry.id_space_station,
        id_city: entry.id_city,
        id_outpost: entry.id_outpost,
        id_faction: entry.id_faction,
        id_jurisdiction: entry.id_jurisdiction,
        name: entry.name,
        nickname: entry.nickname,
        type: entry.type,
        subtype: entry.subtype,
        is_available: entry.is_available,
        is_available_live: entry.is_available_live,
        is_visible: entry.is_visible,
        is_default: entry.is_default,
        is_monitored: entry.is_monitored,
        is_armistice: entry.is_armistice,
        is_landable: entry.is_landable,
        is_decommissioned: entry.is_decommissioned,
        has_quantum_marker: entry.has_quantum_marker,
        has_trade_terminal: entry.has_trade_terminal,
        has_habitation: entry.has_habitation,
        has_refinery: entry.has_refinery,
        has_cargo_center: entry.has_cargo_center,
        has_clinic: entry.has_clinic,
        has_food: entry.has_food,
        has_shops: entry.has_shops,
        has_refuel: entry.has_refuel,
        has_repair: entry.has_repair,
        has_gravity: entry.has_gravity,
        has_loading_dock: entry.has_loading_dock,
        has_docking_port: entry.has_docking_port,
        has_freight_elevator: entry.has_freight_elevator,
        pad_types: entry.pad_types,
        date_added: entry.date_added,
        date_modified: entry.date_modified,
        star_system_name: entry.star_system_name,
        planet_name: entry.planet_name,
        orbit_name: entry.orbit_name,
        moon_name: entry.moon_name,
        space_station_name: entry.space_station_name,
        outpost_name: entry.outpost_name,
        city_name: entry.city_name,
        faction_name: entry.faction_name,
        jurisdiction_name: entry.jurisdiction_name
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced UEX POIs - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: pois.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing UEX POIs:', err);
    throw err;
  }
}

module.exports = { syncUexPois };
