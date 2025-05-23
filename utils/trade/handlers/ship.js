
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
// /trade ship
async function handleTradeShip(interaction) {
    try {
      const shipName = interaction.options.getString('name');
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeShip → shipName=${shipName}`);
  
      const ship = await getVehicleByName(shipName);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Fetched ship:`, ship);
  
      if (!ship) {
        console.warn(`[TRADE HANDLERS] Ship not found: ${shipName}`);
        await safeReply(interaction, `❌ Ship **${shipName}** not found.`);
        return;
      }
  
      const embed = buildShipEmbed(ship);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for ship`);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradeShip error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradeShip
  }