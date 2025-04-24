const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Fetches and parses an RSI user's profile page.
 * @param {string} rsiHandle - RSI citizen handle (case-sensitive)
 * @returns {Promise<{ handle: string, bio: string, enlisted: string | null, avatar: string | null, orgId: string | null, orgRank: string | null, orgName: string | null }> }
 */
async function fetchRsiProfileInfo(rsiHandle) {
  const url = `https://robertsspaceindustries.com/citizens/${rsiHandle}`;
  console.log(`[RSI SCRAPER] Fetching profile for handle: ${rsiHandle} from ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch RSI profile: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Proper handle from profile page (preserves casing)
  const handle = $('.account-profile .info strong.value').first().text().trim();
  const bio = $('.entry.bio .value').text().trim();
  const enlisted = $('.left-col .entry:contains("Enlisted") .value').text().trim();

  const avatarRel = $('.account-profile .thumb img').attr('src');
  const avatar = avatarRel ? `https://robertsspaceindustries.com${avatarRel}` : null;

  let orgId = null, orgRank = null, orgName = null;

  // Org Rank and Org ID (SID)
  $('p.entry').each((_, el) => {
    const label = $(el).find('span.label').text().trim();
    if (label.includes('Spectrum Identification')) {
      orgId = $(el).find('strong.value').text().trim(); // Org Tag / SID
    }
    if (label.includes('Organization rank')) {
      orgRank = $(el).find('strong.value').text().trim();
    }
  });

  // Org Name (using main org box)
  orgName = $('.main-org .info .entry a.value').text().trim();

  console.log(`[RSI SCRAPER] Org name: ${orgName}, SID: ${orgId}, Rank: ${orgRank}`);

  return { handle, bio, enlisted, avatar, orgId, orgRank, orgName };
}

module.exports = { fetchRsiProfileInfo };
