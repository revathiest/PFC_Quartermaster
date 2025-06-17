const fetch = require('node-fetch');
const { OrgTag, Org } = require('../../config/database');

async function syncOrgs() {
  console.log('[API SYNC] Syncing orgs...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const tags = await OrgTag.findAll();
    const base = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/live/organization/';

    for (const tag of tags) {
      const id = tag.rsiOrgId.toUpperCase();
      const url = `${base}${id}`;
      const text = await fetch(url).then(r => r.text());
      const data = JSON.parse(text);
      if (!data?.data) {
        console.warn(`[SKIPPED] Missing data for org ${id}`);
        skipped++;
        continue;
      }
      const [record, wasCreated] = await Org.upsert({ rsiOrgId: id, data: text });
      wasCreated ? created++ : updated++;
    }

    console.log(`[API SYNC] Orgs synced — Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    return { created, updated, skipped, total: tags.length };
  } catch (err) {
    console.error('[API SYNC] Error syncing orgs:', err);
    throw err;
  }
}

module.exports = { syncOrgs };
