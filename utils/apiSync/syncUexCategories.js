const { fetchUexData } = require('../fetchUexData');
const { UexCategory } = require('../../config/database');

async function syncUexCategories() {
  console.log('[API SYNC] Syncing UEX categories...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const response = await fetchUexData('categories');
    const categories = response?.data;

    if (!Array.isArray(categories)) {
      throw new Error('Expected an array of categories');
    }

    for (const entry of categories) {
      if (!entry.id || !entry.name) {
        console.warn('[SKIPPED] Missing ID or name:', entry);
        skipped++;
        continue;
      }

      const [record, wasCreated] = await UexCategory.upsert({
        id: entry.id,
        type: entry.type,
        section: entry.section,
        name: entry.name,
        is_game_related: Boolean(entry.is_game_related),
        is_mining: Boolean(entry.is_mining),
        date_added: entry.date_added,
        date_modified: entry.date_modified
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced categories - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: categories.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing categories:', err);
    throw err;
  }
}

module.exports = { syncUexCategories };
