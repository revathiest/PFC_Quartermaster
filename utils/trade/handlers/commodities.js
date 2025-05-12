
const DEBUG_TRADE = false;

const {
  getSellOptionsAtLocation,
  getBuyOptionsAtLocation,
  getCommodityTradeOptions,
  getVehicleByName,
  getAllShipNames,
  getReturnOptions,
  getTerminalsAtLocation,
  getSellPricesForCommodityElsewhere
} = require('../tradeQueries');

const {
  calculateProfitOptions,
  calculateCircuitTotalProfit
} = require('../tradeCalculations');

const {
  buildBestTradesEmbed,
  buildRouteEmbed,
  buildCircuitEmbed,
  buildPriceEmbed,
  buildShipEmbed,
  buildLocationsEmbed,
  buildCommoditiesEmbed
} = require('../tradeEmbeds');

const {
  buildShipSelectMenu
} = require('../tradeComponents');

// =======================================
// /trade commodities
async function handleTradeCommodities(interaction) {
    try {
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeCommodities triggered`);
      const commodities = await getAllShipNames();
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${commodities.length} commodities`);
  
      if (!commodities.length) {
        console.warn(`[TRADE HANDLERS] No commodities found`);
        await safeReply(interaction, `❌ No known commodities.`);
        return;
      }
  
      const embed = buildCommoditiesEmbed(commodities);
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