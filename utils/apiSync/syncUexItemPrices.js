const { fetchUexData } = require('../fetchUexData');
const { UexItemPrice, UexTerminal } = require('../../config/database');

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

      // Pre-check that the terminal exists
      const terminalExists = await UexTerminal.findByPk(entry.id_terminal);
      if (!terminalExists) {
        console.warn(`[SKIPPED] Item price ID ${entry.id} references missing terminal ID ${entry.id_terminal}`);
        skipped++;
        continue;
      }

      try {
        const [record, wasCreated] = await UexItemPrice.upsert({
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
      } catch (err) {
        // Catch FK errors cleanly and continue
        if (
          err.name === 'SequelizeForeignKeyConstraintError' &&
          err.fields?.includes('id_terminal')
        ) {
          console.warn(`[FK FAIL] Skipped item price ID ${entry.id} - terminal ID ${entry.id_terminal} not valid.`);
          skipped++;
        } else {
          console.error(`[ERROR] Failed to upsert item price ID ${entry.id}:`, err);
          throw err;
        }
      }
    }

    console.log(`[API SYNC] Synced UEX item prices - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: items.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing UEX item prices:', err);
    throw err;
  }
}

module.exports = { syncUexItemPrices };
