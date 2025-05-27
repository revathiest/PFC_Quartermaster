
const DEBUG_TRADE = false;

const {
  getCommodityPricesAtLocation
} = require('../tradeQueries');

const { buildCommodityPricesEmbed } = require('../tradeEmbeds');


const { safeReply } = require('./shared');

// =======================================
// /trade commodities
async function handleTradeCommodities(interaction) {
    try {
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeCommodities triggered`);
      const location = interaction.options.getString('location');
      const prices = await getCommodityPricesAtLocation(location);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${prices.length} price records`);

      if (!prices.length) {
        console.warn(`[TRADE HANDLERS] No commodity prices found at ${location}`);
        await safeReply(interaction, `❌ No commodity data found for **${location}**.`);
        return;
      }

      const embed = buildCommodityPricesEmbed(location, prices);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for commodities`);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradeCommodities error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradeCommodities
  }