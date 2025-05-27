
const DEBUG_TRADE = false;

const {
  getSellOptionsAtLocation
} = require('../tradeQueries');

const { buildCommoditiesEmbed } = require('../tradeEmbeds');

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');



const { safeReply } = require('./shared');

// =======================================
// /trade commodities
const PAGE_SIZE = 3;
const COMMODITIES_PER_FIELD = 20;

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function handleTradeCommodities(interaction, { location, page = 0 } = {}) {
  try {
    location = location || interaction.options.getString('location');
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeCommodities → location=${location}, page=${page}`);

    const records = await getSellOptionsAtLocation(location);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${records.length} price records`);

    if (!records.length) {
      console.warn(`[TRADE HANDLERS] No commodity prices found at ${location}`);
      await safeReply(interaction, `❌ No commodity data found for **${location}**.`);
      return;
    }

    const terminalsMap = {};
    for (const r of records) {
      const terminalName = r.terminal?.nickname || r.terminal?.name || 'UNKNOWN_TERMINAL';
      if (!terminalsMap[terminalName]) terminalsMap[terminalName] = [];
      terminalsMap[terminalName].push({
        name: r.commodity_name,
        buyPrice: r.price_buy,
        sellPrice: r.price_sell
      });
    }
    const terminals = [];
    for (const [terminal, commodities] of Object.entries(terminalsMap)) {
      const parts = chunkArray(commodities, COMMODITIES_PER_FIELD);
      parts.forEach((list, idx) => {
        const name = parts.length > 1 ? `${terminal} (${idx + 1}/${parts.length})` : terminal;
        terminals.push({ terminal: name, commodities: list });
      });
    }

    const chunks = chunkArray(terminals, PAGE_SIZE);
    const pageData = chunks[page] || [];

    const embed = buildCommoditiesEmbed(location, pageData, page, chunks.length);

    const components = [];
    if (chunks.length > 1) {
      components.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`trade_commodities_page::${location}::${page - 1}`)
          .setLabel('◀️ Prev')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId(`trade_commodities_page::${location}::${page + 1}`)
          .setLabel('▶️ Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= chunks.length - 1)
      ));
    }

    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for commodities`);
    await safeReply(interaction, { embeds: [embed], components });

  } catch (err) {
    console.error(`[TRADE HANDLERS] handleTradeCommodities error:`, err);
    if (!interaction.replied) await safeReply(interaction, `⚠️ An error occurred processing your request.`);
  }
}

  module.exports = {
    handleTradeCommodities
  }
