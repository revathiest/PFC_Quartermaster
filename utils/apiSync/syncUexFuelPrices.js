const { fetchUexData } = require('../fetchUexData');
const { UexFuelPrices } = require('../../config/database');

async function syncUexFuelPrices() {
  console.log('[API SYNC] Syncing UEX fuel prices...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const response = await fetchUexData('fuel_prices_all');
    const prices = response?.data;

    if (!Array.isArray(prices)) {
      throw new Error('Expected an array of fuel price entries');
    }

    for (const entry of prices) {
      if (!entry.id || !entry.commodity_name) {
        console.warn('[SKIPPED] Missing ID or commodity name:', entry);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await UexFuelPrice.upsert({
        id: entry.id,
        id_commodity: entry.id_commodity,
        id_terminal: entry.id_terminal,
        price_buy: entry.price_buy,
        price_buy_avg: entry.price_buy_avg,
        date_added: entry.date_added,
        date_modified: entry.date_modified,
        commodity_name: entry.commodity_name,
        terminal_name: entry.terminal_name
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced fuel prices - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: prices.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing fuel prices:', err);
    throw err;
  }
}

module.exports = { syncUexFuelPrices };
