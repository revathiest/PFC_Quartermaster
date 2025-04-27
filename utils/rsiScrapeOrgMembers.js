const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Scrapes the RSI org member list from the public org page.
 * @param {string} orgId - Your RSI organization ID.
 * @returns {Promise<{ members: Array<{ handle: string, rank: string }>, redactedCount: number }>} Members and redacted count.
 */
async function rsiScrapeOrgMembers(orgId) {
  const members = [];
  let redactedCount = 0;
  let page = 1;
  let consecutiveEmptyPages = 0;
  const MAX_EMPTY_PAGES = 3; // Safety net to avoid infinite loops

  try {
    while (consecutiveEmptyPages < MAX_EMPTY_PAGES) {
      const url = `https://robertsspaceindustries.com/orgs/${orgId}/members?page=${page}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
      }

      const data = await response.text();
      const $ = cheerio.load(data);

      const memberBlocks = $('.member-item');
      let foundMembers = 0;

      memberBlocks.each((i, elem) => {
        const handle = $(elem).find('.name-wrap .nick').text().replace(/\s/g, '');
        const rank = $(elem).find('.rank').text().trim();
        if (handle.length > 0) {
          members.push({ handle, rank });
          foundMembers++;
        } else {
          redactedCount++;
        }
      });

      if (foundMembers === 0) {
        consecutiveEmptyPages++;
      } else {
        consecutiveEmptyPages = 0;
      }

      page++;
    }

    return { members, redactedCount };
  } catch (error) {
    console.error(`[rsiScrapeOrgMembers] Error scraping org members: ${error.message}`);
    throw error;
  }
}

module.exports = rsiScrapeOrgMembers;