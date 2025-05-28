
const {
  getCommodityTradeOptions,
} = require('../tradeQueries');

const {
  buildPriceEmbed,
} = require('../tradeEmbeds');

const { safeReply } = require('./shared');

// =======================================
// /trade price
async function handleTradePrice(interaction) {
    try {
      const commodityName = interaction.options.getString('commodity');
      const location = interaction.options.getString('location');
  
      const priceOptions = await getCommodityTradeOptions(commodityName);
  
      const filtered = location
        ? priceOptions.filter(o => o.terminal && (o.terminal.name === location || o.terminal.city_name === location))
        : priceOptions;
  
      if (!filtered.length) {
        console.warn(`[TRADE HANDLERS] No price data found for ${commodityName} at ${location}`);
        await safeReply(interaction, `❌ No price data found for **${commodityName}**${location ? ` at **${location}**` : ''}.`);
        return;
      }
  
      const embed = buildPriceEmbed(commodityName, location, filtered);
      await safeReply(interaction, { embeds: [embed] });
  
    } catch (err) {
      console.error(`[TRADE HANDLERS] handleTradePrice error:`, err);
      if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
    }
  }

  module.exports = {
    handleTradePrice
  }