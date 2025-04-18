const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Fetches and parses an RSI user's profile page
 * @param {string} rsiHandle - RSI citizen handle (case-sensitive)
 * @returns {Promise<{ bio: string, orgId: string | null }>}
 */
async function fetchRsiProfileInfo(rsiHandle) {
  const url = `https://robertsspaceindustries.com/citizens/${rsiHandle}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch RSI profile: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // ✅ Extract Bio
  const bio = $('.entry.bio .value').text().trim();

  // ✅ Extract Org ID (Spectrum Identification)
  const sidLabel = $('span.label').filter((i, el) =>
    $(el).text().trim().includes('Spectrum Identification')
  );
  const orgId = sidLabel.length > 0
    ? sidLabel.next('strong').text().trim().toUpperCase()
    : null;

  return { bio, orgId };
}

module.exports = { fetchRsiProfileInfo };
