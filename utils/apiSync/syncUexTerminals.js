const { fetchUexData } = require('../fetchUexData');
const { UexTerminal } = require('../../config/database');

async function syncUexTerminals() {
  console.log('[API SYNC] Syncing UEX terminals...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const response = await fetchUexData('terminals');
    const terminals = response?.data;

    if (!Array.isArray(terminals)) {
      throw new Error('Expected an array of terminals');
    }

    for (const entry of terminals) {
      if (!entry.id || !entry.name) {
        console.warn('[SKIPPED] Invalid terminal record:', entry);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await UexTerminal.upsert({
        id: entry.id,
        id_star_system: entry.id_star_system,
        id_planet: entry.id_planet,
        id_orbit: entry.id_orbit,
        id_moon: entry.id_moon,
        id_space_station: entry.id_space_station,
        id_outpost: entry.id_outpost,
        id_poi: entry.id_poi,
        id_city: entry.id_city,
        id_faction: entry.id_faction,
        id_company: entry.id_company,

        name: entry.name,
        nickname: entry.nickname,
        code: entry.code,
        type: entry.type,
        contact_url: entry.contact_url,
        mcs: entry.mcs,

        is_available: entry.is_available,
        is_available_live: entry.is_available_live,
        is_visible: entry.is_visible,
        is_default_system: entry.is_default_system,
        is_affinity_influenceable: entry.is_affinity_influenceable,
        is_habitation: entry.is_habitation,
        is_refinery: entry.is_refinery,
        is_cargo_center: entry.is_cargo_center,
        is_medical: entry.is_medical,
        is_food: entry.is_food,
        is_shop_fps: entry.is_shop_fps,
        is_shop_vehicle: entry.is_shop_vehicle,
        is_refuel: entry.is_refuel,
        is_repair: entry.is_repair,
        is_nqa: entry.is_nqa,
        is_jump_point: entry.is_jump_point,
        is_player_owned: entry.is_player_owned,
        is_auto_load: entry.is_auto_load,

        has_loading_dock: entry.has_loading_dock,
        has_docking_port: entry.has_docking_port,
        has_freight_elevator: entry.has_freight_elevator,

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
        company_name: entry.company_name,

        max_container_size: entry.max_container_size
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Terminals synced — Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: terminals.length };

  } catch (err) {
    console.error('[API SYNC] Error syncing UEX terminals:', err);
    throw err;
  }
}

module.exports = { syncUexTerminals };
