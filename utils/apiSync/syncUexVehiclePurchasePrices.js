const { fetchUexData } = require('../fetchUexData');
const { UexVehiclePurchasePrice } = require('../../config/database');

async function syncUexVehiclePurchasePrices() {
  console.log('[API SYNC] Syncing UEX vehicle purchase prices...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const response = await fetchUexData('vehicles_purchases_prices_all');
    const prices = response?.data;

    if (!Array.isArray(prices)) {
      throw new Error('Expected an array of vehicle purchase price entries');
    }

    for (const entry of prices) {
      if (!entry.id || !entry.vehicle_name) {
        console.warn('[SKIPPED] Missing ID or vehicle name:', entry);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await UexVehiclePurchasePrice.upsert({
        id: entry.id,
        id_vehicle: entry.id_vehicle,
        id_terminal: entry.id_terminal,
        price_buy: entry.price_buy,
        date_added: entry.date_added,
        date_modified: entry.date_modified,
        vehicle_name: entry.vehicle_name,
        terminal_name: entry.terminal_name
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced vehicle purchase prices - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: prices.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing vehicle purchase prices:', err);
    throw err;
  }
}

module.exports = { syncUexVehiclePurchasePrices };
