const {
  getVehicleByName,
} = require('../tradeQueries');

const {
  buildShipEmbed,
} = require('../tradeEmbeds');

const { safeReply } = require('./shared');

// =======================================
// /trade ship
async function handleTradeShip(interaction) {
    try {
      const shipName = interaction.options.getString('name');
  
      const ship = await getVehicleByName(shipName);
  
      if (!ship) {
        console.warn(`[TRADE HANDLERS] Ship not found: ${shipName}`);
        await safeReply(interaction, `❌ Ship **${shipName}** not found.`);
        return;
      }
  
      const embed = buildShipEmbed(ship);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradeShip error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradeShip
  }