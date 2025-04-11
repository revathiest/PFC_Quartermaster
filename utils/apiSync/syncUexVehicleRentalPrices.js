const { fetchUexData } = require('../fetchUexData');
const { UexVehicleRentalPrice } = require('../../config/database');

async function syncUexVehicleRentalPrices() {
  console.log('[API SYNC] Syncing UEX vehicle rental prices...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const response = await fetchUexData('vehicles_rentals_prices_all');
    const prices = response?.data;

    if (!Array.isArray(prices)) {
      throw new Error('Expected an array of vehicle rental price entries');
    }

    for (const entry of prices) {
      if (!entry.id || !entry.vehicle_name) {
        console.warn('[SKIPPED] Missing ID or vehicle name:', entry);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await UexVehicleRentalPrice.upsert({
        id: entry.id,
        id_vehicle: entry.id_vehicle,
        id_terminal: entry.id_terminal,
        price_rent: entry.price_rent,
        date_added: entry.date_added,
        date_modified: entry.date_modified,
        vehicle_name: entry.vehicle_name,
        terminal_name: entry.terminal_name
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced vehicle rental prices - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: prices.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing vehicle rental prices:', err);
    throw err;
  }
}

module.exports = { syncUexVehicleRentalPrices };
