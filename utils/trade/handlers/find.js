
const DEBUG_TRADE = false;

const { getCommodityTradeOptions } = require('../tradeQueries');



const { buildPriceEmbed } = require('../tradeEmbeds');


const { safeReply } = require('./shared');

// =======================================
// /trade find
async function handleTradeFind(interaction) {
    try {
  const commodity = interaction.options.getString('commodity');
  const type = interaction.options.getString('type');
  const near = interaction.options.getString('near');
  if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeFind → commodity=${commodity}, type=${type}, near=${near}`);

  const records = await getCommodityTradeOptions(commodity);
  const filtered = records.filter(r => {
    const price = type === 'buy' ? r.price_buy : r.price_sell;
    if (!price || price <= 0) return false;
    if (!near) return true;
    const t = r.terminal;
    return t && (t.name === near || t.city_name === near || t.planet_name === near);
  });

  if (!filtered.length) {
    console.warn(`[TRADE HANDLERS] No ${type} options found for ${commodity}`);
    await safeReply(interaction, `❌ No ${type} locations found for **${commodity}**${near ? ` near **${near}**` : ''}.`);
    return;
  }

  filtered.sort((a, b) => type === 'buy' ? a.price_buy - b.price_buy : b.price_sell - a.price_sell);

  const embed = buildPriceEmbed(commodity, near, filtered);
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