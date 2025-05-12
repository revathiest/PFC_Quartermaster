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
// /trade circuit
async function handleTradeBestCircuit(interaction) {
    try {
      const fromLocation = interaction.options.getString('from');
      const shipName = interaction.options.getString('with');
      const cash = interaction.options.getInteger('cash') ?? 100000;
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeBestCircuit → fromLocation=${fromLocation}, shipName=${shipName}, cash=${cash}`);
  
      const ship = shipName ? await getVehicleByName(shipName) : { scu: 66 };
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Retrieved ship:`, ship);
  
      const outboundOptions = await getSellOptionsAtLocation(fromLocation);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${outboundOptions.length} outbound sellOptions`);
  
      const outboundProfits = calculateProfitOptions(outboundOptions, ship.scu, cash);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Calculated ${outboundProfits.length} outbound profits`);
  
      if (!outboundProfits.length) {
        console.warn(`[TRADE HANDLERS] No outbound profits from ${fromLocation}`);
        await safeReply(interaction, `❌ No outbound profitable trades from **${fromLocation}**.`);
        return;
      }
  
      const topOutbound = outboundProfits[0];
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Top outbound trade:`, topOutbound);
  
      const returnOptions = await getReturnOptions(fromLocation, topOutbound.terminal);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${returnOptions.length} returnOptions`);
  
      const returnProfits = calculateProfitOptions(returnOptions, ship.scu, cash);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Calculated ${returnProfits.length} return profits`);
  
      const topReturn = returnProfits.length ? returnProfits[0] : null;
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Top return trade:`, topReturn);
  
      const embed = buildCircuitEmbed(topOutbound, topReturn, fromLocation);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for circuit`);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradeBestCircuit error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradeBestCircuit
  }