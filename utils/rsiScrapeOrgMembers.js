const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Scrapes the RSI org member list from the public org page.
 * @param {string} orgId - Your RSI organization ID.
 * @returns {Promise<Array<{ handle: string, rank: string }>>} Array of org members.
 */
async function rsiScrapeOrgMembers(orgId) {
  const members = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      const url = `https://robertsspaceindustries.com/orgs/${orgId}/members?page=${page}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
      }

      const data = await response.text();
      const $ = cheerio.load(data);

      const memberBlocks = $('.member');
      if (memberBlocks.length === 0) {
        hasMore = false;
        break;
      }

      memberBlocks.each((i, elem) => {
        const handle = $(elem).find('.handle').text().trim();
        const rank = $(elem).find('.rank').text().trim();
        if (handle) {
          members.push({ handle, rank });
        }
      });

      page++;
    }

    return members;
  } catch (error) {
    console.error(`[rsiScrapeOrgMembers] Error scraping org members: ${error.message}`);
    throw error;
  }
}

module.exports = rsiScrapeOrgMembers
