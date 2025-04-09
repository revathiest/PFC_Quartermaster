const fetch = require('node-fetch');
const db = require('../../models'); // Adjust if your Sequelize init is elsewhere

async function syncUexVehicles() {
  const url = 'https://api.uexcorp.space/2.0/vehicles';
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.UEX_API_TOKEN}`
    }
  });

  if (!res.ok) throw new Error(`Failed to fetch vehicles: ${res.status}`);
  const data = await res.json();

  const results = [];

  for (const v of data) {
    const [vehicle, created] = await db.UexVehicle.upsert({
      id: v.id,
      uuid: v.uuid,
      name: v.name,
      name_full: v.name_full,
      slug: v.slug,
      company_name: v.company_name,
      crew: v.crew,
      scu: v.scu,
      mass: v.mass,
      width: v.width,
      height: v.height,
      length: v.length,
      fuel_quantum: v.fuel_quantum,
      fuel_hydrogen: v.fuel_hydrogen,
      container_sizes: v.container_sizes,
      pad_type: v.pad_type,
      game_version: v.game_version,
      date_added: v.date_added,
      date_modified: v.date_modified,
      url_store: v.url_store,
      url_brochure: v.url_brochure,
      url_hotsite: v.url_hotsite,
      url_video: v.url_video,
      url_photos: JSON.stringify(v.url_photos),

      is_spaceship: v.is_spaceship,
      is_ground_vehicle: v.is_ground_vehicle,
      is_single_pilot: v.is_single_pilot,
      is_multi_crew: v.is_multi_crew,
      is_combat: v.is_combat,
      is_exploration: v.is_exploration,
      is_industry: v.is_industry,
      is_cargo: v.is_cargo,
      is_refinery: v.is_refinery,
      is_mining: v.is_mining,
      is_salvage: v.is_salvage,
      is_transport: v.is_transport,
      is_medical: v.is_medical,
      is_racing: v.is_racing,
      is_touring: v.is_touring,
      is_data: v.is_data,
      is_stealth: v.is_stealth,
      is_military: v.is_military,
      is_civilian: v.is_civilian,
      is_personal_transport: v.is_personal_transport,
      is_vehicle_transport: v.is_vehicle_transport,
      is_research: v.is_research,
      is_pathfinder: v.is_pathfinder,
      is_multirole: v.is_multirole
    });

    results.push({ id: v.id, name: v.name, created });
  }

  return {
    endpoint: 'uex_vehicles',
    created: results.filter(r => r.created).length,
    updated: results.length - results.filter(r => r.created).length,
    skipped: 0,
    total: results.length
  };
}

module.exports = {
  syncUexVehicles
};
