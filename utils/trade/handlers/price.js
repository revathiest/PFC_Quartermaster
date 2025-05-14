
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

const { safeReply } = require('./shared');

// =======================================
// /trade price
async function handleTradePrice(interaction) {
    try {
      const commodityName = interaction.options.getString('commodity');
      const location = interaction.options.getString('location');
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradePrice → commodityName=${commodityName}, location=${location}`);
  
      const priceOptions = await getCommodityTradeOptions(commodityName);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${priceOptions.length} priceOptions for ${commodityName}`);
  
      const filtered = location
        ? priceOptions.filter(o => o.terminal && (o.terminal.name === location || o.terminal.city_name === location))
        : priceOptions;
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Filtered down to ${filtered.length} priceOptions for location filter`);
  
      if (!filtered.length) {
        console.warn(`[TRADE HANDLERS] No price data found for ${commodityName} at ${location}`);
        await safeReply(interaction, `❌ No price data found for **${commodityName}**${location ? ` at **${location}**` : ''}.`);
        return;
      }
  
      const embed = buildPriceEmbed(commodityName, location, filtered);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for price`);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradePrice error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradePrice
  }