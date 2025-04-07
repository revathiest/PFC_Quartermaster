// utils/apiSync/galactapedia.js
const { fetchSCData } = require('../../utils/fetchSCData');
const { GalactapediaEntry } = require('../../config/database');

async function syncGalactapedia() {
  console.log('[API SYNC] Syncing Galactapedia entries...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const entries = await fetchSCData('galactapedia');

    if (!Array.isArray(entries)) {
      throw new Error('Expected an array of Galactapedia entries');
    }

    for (const entry of entries) {

      const [record, wasCreated] = await GalactapediaEntry.upsert({
        id,
        title: entry.title,
        slug: entry.slug,
        thumbnail: entry.thumbnail,
        type: entry.type,
        rsi_url: entry.url,
        api_url: entry.link,
        created_at: entry.created_at ?? null
      });

      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Synced Galactapedia entries - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: entries.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing Galactapedia entries:', err);
    throw err;
  }
}

module.exports = { syncGalactapedia };
