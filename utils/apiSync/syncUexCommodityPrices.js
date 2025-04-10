const { fetchUexData } = require('../fetchUexData');
const { UexCommodityPrice } = require('../../config/database');

async function syncUexCommodityPrices() {
  console.log('[API SYNC] Syncing UEX commodity prices...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const response = await fetchUexData('commodities_prices_all');
    const prices = response?.data;

    if (!Array.isArray(prices)) {
      throw new Error('Expected an array of commodity price entries');
    }

    for (const entry of prices) {
      if (!entry.id || !entry.commodity_name) {
        console.warn('[SKIPPED] Missing ID or commodity name:', entry);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await UexCommodityPrice.upsert({
        id: entry.id,
        id_commodity: entry.id_commodity,
        id_terminal: entry.id_terminal,

        price_buy: entry.price_buy,
        price_buy_avg: entry.price_buy_avg,
        price_sell: entry.price_sell,
        price_sell_avg: entry.price_sell_avg,

        scu_buy: entry.scu_buy,
        scu_buy_avg: entry.scu_buy_avg,
        scu_sell_stock: entry.scu_sell_stock,
        scu_sell_stock_avg: entry.scu_sell_stock_avg,
        scu_sell: entry.scu_sell,
        scu_sell_avg: entry.scu_sell_avg,

        status_buy: entry.status_buy,
        status_sell: entry.status_sell,

        container_sizes: entry.container_sizes,

        date_added: entry.date_added,
        date_modified: entry.date_modified,

        commodity_name: entry.commodity_name,
        terminal_name: entry.terminal_name
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced commodity prices - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: prices.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing commodity prices:', err);
    throw err;
  }
}

module.exports = { syncUexCommodityPrices };
