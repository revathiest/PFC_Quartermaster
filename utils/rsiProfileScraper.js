const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Fetches and parses an RSI user's profile page
 * @param {string} rsiHandle - RSI citizen handle (case-sensitive)
 * @returns {Promise<{ bio: string, orgId: string | null, orgRank: string | null }>}
 */
async function fetchRsiProfileInfo(rsiHandle) {
  const url = `https://robertsspaceindustries.com/citizens/${rsiHandle}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch RSI profile: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Bio
  const bio = $('.entry.bio .value').text().trim();

  // Org ID (SID)
  let orgId = null;

  $('p.entry').each((_, el) => {
    const label = $(el).find('span.label').text().trim();
    if (label.includes('Spectrum Identification')) {
      orgId = $(el).find('strong.value').text().trim().toUpperCase();
    }
  });

  

  // Org Rank
  let orgRank = null;

  $('p.entry').each((_, el) => {
    const label = $(el).find('span.label').text().trim();
    if (label.includes('Organization rank')) {
      orgRank = $(el).find('strong.value').text().trim();
    }
  });

  

  return { bio, orgId, orgRank };
}

module.exports = { fetchRsiProfileInfo };
