const { fetchUexData } = require('../fetchUexData');
const { UexItemPrices } = require('../../config/database');

async function syncUexItemPrices() {
  console.log('[API SYNC] Syncing UEX item prices...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const response = await fetchUexData('items_prices_all');
    const items = response?.data;

    if (!Array.isArray(items)) {
      throw new Error('Expected an array of item prices');
    }

    for (const entry of items) {
      if (!entry.id || !entry.item_name) {
        console.warn('[SKIPPED] Missing ID or item_name:', entry);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await UexItemPrices.upsert({
        id: entry.id,
        id_item: entry.id_item,
        id_category: entry.id_category,
        id_terminal: entry.id_terminal,
        price_buy: entry.price_buy,
        price_sell: entry.price_sell,
        date_added: entry.date_added,
        date_modified: entry.date_modified,
        item_name: entry.item_name,
        item_uuid: entry.item_uuid,
        terminal_name: entry.terminal_name
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced UEX item prices - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: items.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing UEX item prices:', err);
    throw err;
  }
}

module.exports = { syncUexItemPrices };
