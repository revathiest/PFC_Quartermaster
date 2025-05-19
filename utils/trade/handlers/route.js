// utils/trade/handlers/route.js
const { getBuyOptionsAtLocation, getSellOptionsAtLocation } = require('../tradeQueries');
const { calculateProfitOptions } = require('../tradeCalculations');
const { buildBestTradesEmbed } = require('../tradeEmbeds');
const { buildLocationSelectMenu } = require('../tradeComponents');
const { safeReply } = require('./shared');
const { MessageFlags } = require('discord.js');

async function handleTradeRouteCore({ fromLocation, toLocation }) {
  const buyOptions = await getBuyOptionsAtLocation(fromLocation);
  const sellOptions = await getSellOptionsAtLocation(toLocation);

  const paired = [];
  for (const buy of buyOptions) {
    const matchingSell = sellOptions.find(sell => sell.commodity_name === buy.commodity_name);
    if (!matchingSell) continue;

    paired.push({
      commodity_name: buy.commodity_name,
      buyPrice: buy.price_buy,
      sellPrice: matchingSell.price_sell,
      scu_buy: buy.scu_buy,
      terminal: buy.terminal,
      sellTerminal: matchingSell.terminal,
      location: buy.terminal.city_name ?? buy.terminal.planet_name
    });
  }

  const profitOptions = calculateProfitOptions(paired, null, null);
  if (!profitOptions.length) {
    return { error: `🔍 No profitable trades found from **${fromLocation}** to **${toLocation}**.` };
  }

  const embed = buildBestTradesEmbed(fromLocation, profitOptions)// utils/trade/handlers/route.js
  const { getBuyOptionsAtLocation, getSellOptionsAtLocation } = require('../tradeQueries');
  const { calculateProfitOptions } = require('../tradeCalculations');
  const { buildBestTradesEmbed } = require('../tradeEmbeds');
  const { buildLocationSelectMenu } = require('../tradeComponents');
  const { safeReply, TradeStateCache } = require('./shared');
  const { MessageFlags } = require('discord.js');
  
  async function handleTradeRouteCore({ fromLocation, toLocation }) {
    const buyOptions = await getBuyOptionsAtLocation(fromLocation);
    const sellOptions = await getSellOptionsAtLocation(toLocation);
  
    const paired = [];
    for (const buy of buyOptions) {
      const matchingSell = sellOptions.find(sell => sell.commodity_name === buy.commodity_name);
      if (!matchingSell) continue;
  
      paired.push({
        commodity_name: buy.commodity_name,
        buyPrice: buy.price_buy,
        sellPrice: matchingSell.price_sell,
        scu_buy: buy.scu_buy,
        terminal: buy.terminal,
        sellTerminal: matchingSell.terminal,
        location: buy.terminal.city_name ?? buy.terminal.planet_name
      });
    }
  
    const profitOptions = calculateProfitOptions(paired, null, null);
    if (!profitOptions.length) {
      return { error: `🔍 No profitable trades found from **${fromLocation}** to **${toLocation}**.` };
    }
  
    const embed = buildBestTradesEmbed(fromLocation, profitOptions);
    return { embed };
  }
  
  async function handleTradeRoute(interaction, client, { from, to }) {
    await interaction.deferReply({ ephemeral: true });
  
    const allFromMatches = await getBuyOptionsAtLocation(from);
    const allToMatches = await getSellOptionsAtLocation(to);
  
    const fromCandidates = [...new Set(allFromMatches.map(opt => opt.terminal?.location_name).filter(Boolean))];
    const toCandidates = [...new Set(allToMatches.map(opt => opt.terminal?.location_name).filter(Boolean))];
  
    if (fromCandidates.length > 1 || toCandidates.length > 1) {
      const userId = interaction.user.id;
      TradeStateCache.set(userId, { fromQuery: from, toQuery: to });
  
      const components = [];
      if (fromCandidates.length > 1) {
        components.push(buildLocationSelectMenu(fromCandidates, 'trade::route::select_from'));
      }
      if (toCandidates.length > 1) {
        components.push(buildLocationSelectMenu(toCandidates, 'trade::route::select_to'));
      }
  
      return safeReply(interaction, {
        content: `Multiple location matches found. Please select the correct location(s).`,
        components,
        flags: MessageFlags.Ephemeral
      });
    }
  
    const fromResolved = fromCandidates[0] ?? from;
    const toResolved = toCandidates[0] ?? to;
  
    const result = await handleTradeRouteCore({ fromLocation: fromResolved, toLocation: toResolved });
  
    if (result.error) {
      return safeReply(interaction, { content: result.error, flags: MessageFlags.Ephemeral });
    }
  
    return safeReply(interaction, { embeds: [result.embed] });
  }
  
  module.exports = {
    handleTradeRoute
  };
  
}

async function handleTradeRoute(interaction, client, { from, to }) {
  await interaction.deferReply({ ephemeral: true });

  // TODO: implement match resolution and dropdown fallback like in /best
  const result = await handleTradeRouteCore({ fromLocation: from, toLocation: to });

  if (result.error) {
    return safeReply(interaction, { content: result.error, flags: MessageFlags.Ephemeral });
  }

  return safeReply(interaction, { embeds: [result.embed] });
}

module.exports = {
  handleTradeRoute
};
