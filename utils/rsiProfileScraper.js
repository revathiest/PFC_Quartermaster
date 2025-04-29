const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Fetches and parses an RSI user's profile page.
 * @param {string} rsiHandle - RSI citizen handle (case-sensitive)
 * @returns {Promise<{ handle: string, bio: string, enlisted: string | null, avatar: string | null, orgId: string | null, orgRank: string | null, orgName: string | null }> }
 */
async function fetchRsiProfileInfo(rsiHandle) {
  const url = `https://robertsspaceindustries.com/citizens/${rsiHandle}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Unable to fetch RSI profile for handle: ${rsiHandle}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const handle = $('.account-profile .info p.entry')
    .filter((_, el) => $(el).find('.label').text().trim().includes('Handle name'))
    .find('strong.value')
    .text()
    .trim();

  if (!handle) {
    throw new Error(`Could not parse RSI profile for handle: ${rsiHandle}`);
  }

  const bio = $('.entry.bio .value').text().trim() || '';
  const enlisted = $('.left-col .entry')
    .filter((_, el) => $(el).find('.label').text().trim() === 'Enlisted')
    .find('strong.value')
    .text()
    .trim() || '';

  const avatarRel = $('.account-profile .thumb img').attr('src');
  let avatar = null;
  if (avatarRel) {
    if (avatarRel.startsWith('http://') || avatarRel.startsWith('https://')) {
      avatar = avatarRel;
    } else if (avatarRel.startsWith('/')) {
      avatar = `https://robertsspaceindustries.com${avatarRel}`;
    }
  }

  let orgId = null, orgRank = null;
  $('p.entry').each((_, el) => {
    const label = $(el).find('span.label').text().trim();
    if (label.includes('Spectrum Identification')) {
      orgId = $(el).find('strong.value').text().trim() || null;
    }
    if (label.includes('Organization rank')) {
      orgRank = $(el).find('strong.value').text().trim() || null;
    }
  });

  const orgName = $('.main-org .info .entry a.value').text().trim() || '';

  return { handle, bio, enlisted, avatar, orgId, orgRank, orgName };
}

module.exports = { fetchRsiProfileInfo };
