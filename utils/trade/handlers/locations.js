
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
      const terminals = await getTerminalsAtLocation('%');
  
      if (!terminals.length) {
        console.warn(`[TRADE HANDLERS] No terminals found`);
        await safeReply(interaction, `❌ No known terminals.`);
        return;
      }
  
      const embed = buildLocationsEmbed(terminals);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradeLocations error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradeLocations
  }