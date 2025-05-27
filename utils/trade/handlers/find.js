
const DEBUG_TRADE = false;

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
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeFind → fromLocation=${fromLocation}, toLocation=${toLocation}`);
  
      const sellOptions = await getSellOptionsAtLocation(fromLocation);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${sellOptions.length} sellOptions from ${fromLocation}`);
  
      const filtered = sellOptions.filter(o =>
        o.terminal && (o.terminal.name === toLocation || o.terminal.city_name === toLocation)
      );
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Filtered down to ${filtered.length} options matching toLocation`);
  
      if (!filtered.length) {
        console.warn(`[TRADE HANDLERS] No trades found from ${fromLocation} to ${toLocation}`);
        await safeReply(interaction, `❌ No trades found from **${fromLocation}** to **${toLocation}**.`);
        return;
      }
  
      const profitOptions = calculateProfitOptions(filtered, 66, 100000);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Calculated ${profitOptions.length} profits`);
  
      const embed = buildBestTradesEmbed(`${fromLocation} → ${toLocation}`, profitOptions);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for trade find`);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradeFind error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradeFind
  }