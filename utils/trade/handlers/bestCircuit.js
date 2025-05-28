const {
  getSellOptionsAtLocation,
  getVehicleByName,
  getReturnOptions,
} = require('../tradeQueries');

const {
  calculateProfitOptions,
} = require('../tradeCalculations');

const {
  buildCircuitEmbed,
} = require('../tradeEmbeds');

const {
} = require('../tradeComponents');

const { safeReply } = require('./shared');

// =======================================
// /trade circuit
async function handleTradeBestCircuit(interaction) {
    try {
      const fromLocation = interaction.options.getString('from');
      const shipName = interaction.options.getString('with');
      const cash = interaction.options.getInteger('cash') ?? 100000;
  
      const ship = shipName ? await getVehicleByName(shipName) : { scu: 66 };
  
      const outboundOptions = await getSellOptionsAtLocation(fromLocation);
  
      const outboundProfits = calculateProfitOptions(outboundOptions, ship.scu, cash);
  
      if (!outboundProfits.length) {
        console.warn(`[TRADE HANDLERS] No outbound profits from ${fromLocation}`);
        await safeReply(interaction, `❌ No outbound profitable trades from **${fromLocation}**.`);
        return;
      }
  
      const topOutbound = outboundProfits[0];
  
      const returnOptions = await getReturnOptions(fromLocation, topOutbound.terminal);
  
      const returnProfits = calculateProfitOptions(returnOptions, ship.scu, cash);
  
      const topReturn = returnProfits.length ? returnProfits[0] : null;
  
      const embed = buildCircuitEmbed(topOutbound, topReturn, fromLocation);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradeBestCircuit error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradeBestCircuit
  }