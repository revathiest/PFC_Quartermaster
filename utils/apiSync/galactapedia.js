// utils/apiSync/galactapedia.js
const { GalactapediaEntry } = require('../../config/database');
const { fetchSCData } = require('../../utils/fetchSCData');

async function syncGalactapediaEntries() {
  const baseUrl = 'https://api.star-citizen.wiki/api/v2/galactapedia';
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalFetched = 0;

  let page = 1;
  let nextPageUrl = `${baseUrl}?page=${page}`;

  while (nextPageUrl) {
    const response = await fetchSCData(nextPageUrl);
    const entries = response?.data || [];
    totalFetched += entries.length;

    for (const entry of entries) {
      const [record, created] = await GalactapediaEntry.upsert({
        id: entry.id,
        title: entry.title,
        slug: entry.slug,
        thumbnail: entry.thumbnail,
        type: entry.type,
        rsi_url: entry.url,
        api_url: entry.api_url,
        created_at: entry.created_at
      });

      if (created) totalCreated++;
      else totalUpdated++;
    }

    nextPageUrl = response.links?.next || null;
  }

  return {
    created: totalCreated,
    updated: totalUpdated,
    total: totalFetched
  };
}

module.exports = { syncGalactapediaEntries };
