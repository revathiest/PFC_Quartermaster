
const DEBUG_TRADE = false;

const {
  getTerminalsAtLocation,
} = require('../tradeQueries');

const {
} = require('../tradeCalculations');

const {
  buildLocationsEmbed,
} = require('../tradeEmbeds');

const { safeReply } = require('./shared');

// =======================================
// /trade locations
async function handleTradeLocations(interaction) {
    try {
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeLocations triggered`);
      const terminals = await getTerminalsAtLocation('%');
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${terminals.length} terminals`);
  
      if (!terminals.length) {
        console.warn(`[TRADE HANDLERS] No terminals found`);
        await safeReply(interaction, `❌ No known terminals.`);
        return;
      }
  
      const embed = buildLocationsEmbed(terminals);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for locations`);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradeLocations error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradeLocations
  }