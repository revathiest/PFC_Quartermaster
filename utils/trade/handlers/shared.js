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

const pendingBest = new Map();

async function safeReply(interaction, payload) {
  if (!interaction || typeof interaction.reply !== 'function') {
    console.error('[safeReply] Invalid interaction object:', interaction);
    return;
  }

  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.editReply(payload);
    } else {
      return await interaction.reply(payload);
    }
  } catch (err) {
    console.error(`[safeReply] Failed to respond to interaction`, err);
  }
}

module.exports = {
  safeReply,
  pendingBest
};
