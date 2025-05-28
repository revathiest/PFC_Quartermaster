// utils/trade/handlers/route.js

const { getBuyOptionsAtLocation, getSellOptionsAtLocation } = require('../tradeQueries');
const { calculateProfitOptions } = require('../tradeCalculations');
const { resolveBestMatchingTerminal } = require('../resolveBestMatchingTerminal');
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

  const profitOptions = calculateProfitOptions(paired, Infinity, null);
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



  const fromTerminals = allFromMatches.map(opt => opt.terminal).filter(Boolean);
  const toTerminals = allToMatches.map(opt => opt.terminal).filter(Boolean);
  
  const fromTerminal = resolveBestMatchingTerminal(from, fromTerminals);
  const toTerminal = resolveBestMatchingTerminal(to, toTerminals);
  if (!fromTerminal || !toTerminal) {
    return safeReply(interaction, {
      content: `❌ Could not confidently resolve one or both locations: "${from}" or "${to}".`,
      flags: MessageFlags.Ephemeral
    });
  }
  
  const fromResolved = fromTerminal.name;
  const toResolved = toTerminal.name;


  const result = await handleTradeRouteCore({ fromLocation: fromResolved, toLocation: toResolved });

  if (result.error) {
    return safeReply(interaction, { content: result.error, flags: MessageFlags.Ephemeral });
  }

  return safeReply(interaction, { embeds: [result.embed] });
}

module.exports = {
  handleTradeRoute
};
