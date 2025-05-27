
const DEBUG_TRADE = false;

const {
  getSellOptionsAtLocation
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
// /trade commodities
async function handleTradeCommodities(interaction) {
  try {
    const location = interaction.options.getString('location');
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeCommodities → location=${location}`);

    const records = await getSellOptionsAtLocation(location);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${records.length} price records`);

    if (!records.length) {
      console.warn(`[TRADE HANDLERS] No commodity prices found at ${location}`);
      await safeReply(interaction, `❌ No commodity data found for **${location}**.`);
      return;
    }

    const commodities = records.map(r => ({
      name: r.commodity_name,
      buyPrice: r.price_buy,
      sellPrice: r.price_sell,
      averagePrice: Math.round(((r.price_buy ?? 0) + (r.price_sell ?? 0)) / 2) || null,
      margin: r.price_sell != null && r.price_buy != null ? r.price_sell - r.price_buy : null
    }));

    const embed = buildCommoditiesEmbed(location, commodities);
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