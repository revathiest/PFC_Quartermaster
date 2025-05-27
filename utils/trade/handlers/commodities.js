
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

    const terminalsMap = {};
    for (const r of records) {
      const terminalName = r.terminal?.nickname || r.terminal?.name || 'UNKNOWN_TERMINAL';
      if (!terminalsMap[terminalName]) terminalsMap[terminalName] = [];
      terminalsMap[terminalName].push({
        name: r.commodity_name,
        buyPrice: r.price_buy,
        sellPrice: r.price_sell
      });
    }
    const terminals = Object.entries(terminalsMap).map(([terminal, commodities]) => ({ terminal, commodities }));

    const embed = buildCommoditiesEmbed(location, terminals);
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