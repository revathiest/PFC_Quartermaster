
const {
  getSellOptionsAtLocation,
} = require('../tradeQueries');

const {
  calculateProfitOptions,
} = require('../tradeCalculations');

const {
  buildBestTradesEmbed,
} = require('../tradeEmbeds');

const { safeReply } = require('./shared');

// =======================================
// /trade find
async function handleTradeFind(interaction) {
    try {
      const fromLocation = interaction.options.getString('from');
      const toLocation = interaction.options.getString('to');
  
      const sellOptions = await getSellOptionsAtLocation(fromLocation);
  
      const filtered = sellOptions.filter(o =>
        o.terminal && (o.terminal.name === toLocation || o.terminal.city_name === toLocation)
      );
  
      if (!filtered.length) {
        console.warn(`[TRADE HANDLERS] No trades found from ${fromLocation} to ${toLocation}`);
        await safeReply(interaction, `❌ No trades found from **${fromLocation}** to **${toLocation}**.`);
        return;
      }
  
      const profitOptions = calculateProfitOptions(filtered, 66, 100000);
  
      const embed = buildBestTradesEmbed(`${fromLocation} → ${toLocation}`, profitOptions);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradeFind error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradeFind
  }