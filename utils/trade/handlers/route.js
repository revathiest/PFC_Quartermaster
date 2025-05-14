const DEBUG_TRADE = false;

const {
  getCommodityTradeOptions,
} = require('../tradeQueries');

const {
} = require('../tradeCalculations');

const {
  buildRouteEmbed,
} = require('../tradeEmbeds');

const {
} = require('../tradeComponents');

const { safeReply } = require('./shared');

// =======================================
// /trade route
async function handleTradeRoute(interaction) {
    try {
      const fromLocation = interaction.options.getString('from');
      const commodityName = interaction.options.getString('commodity');
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeRoute → fromLocation=${fromLocation}, commodityName=${commodityName}`);
  
      const tradeOptions = await getCommodityTradeOptions(commodityName);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${tradeOptions.length} tradeOptions for ${commodityName}`);
  
      const sellOptions = tradeOptions.filter(o => o.terminal && o.terminal.city_name !== fromLocation);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Filtered down to ${sellOptions.length} sellOptions excluding fromLocation`);
  
      if (!sellOptions.length) {
        console.warn(`[TRADE HANDLERS] No sell options for ${commodityName} from ${fromLocation}`);
        await safeReply(interaction, `❌ No sell options found for **${commodityName}** from **${fromLocation}**.`);
        return;
      }
  
      const embed = buildRouteEmbed(commodityName, fromLocation, sellOptions);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for route`);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradeRoute error:`, err);
      if (!interaction.replied) await safeReply(`⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradeRoute
  }