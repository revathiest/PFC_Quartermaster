const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Fetches and parses an RSI user's profile page.
 * @param {string} rsiHandle - RSI citizen handle (case-sensitive)
 * @returns {Promise<{ handle: string, bio: string, enlisted: string | null, avatar: string | null, orgRank: string | null, orgName: string | null }>}
 */
async function fetchRsiProfileInfo(rsiHandle) {
  const url = `https://robertsspaceindustries.com/citizens/${rsiHandle}`;

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

  let orgRank = null, orgName = null;

  $('p.entry').each((_, el) => {
    const label = $(el).find('span.label').text().trim();
    if (label.includes('Organization rank')) {
      orgRank = $(el).find('strong.value').text().trim();
    }
  });

  orgName = $('.main-org .info .entry a.value').text().trim();

  return { handle, bio, enlisted, avatar, orgRank, orgName };
}

module.exports = { fetchRsiProfileInfo };
