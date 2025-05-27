// utils/trade/handlers/route.js
const DEBUG_ROUTE = true;

const { getBuyOptionsAtLocation, getSellOptionsAtLocation } = require('../tradeQueries');
const { calculateProfitOptions } = require('../tradeCalculations');
const { resolveBestMatchingTerminal } = require('../resolveBestMatchingTerminal');
const { buildBestTradesEmbed } = require('../tradeEmbeds');
const { buildLocationSelectMenu } = require('../tradeComponents');
const { safeReply, TradeStateCache } = require('./shared');
const { MessageFlags } = require('discord.js');

async function handleTradeRouteCore({ fromLocation, toLocation }) {
  if (DEBUG_ROUTE) console.log(`[ROUTE][core] Resolving: from=${fromLocation}, to=${toLocation}`);

  const buyOptions = await getBuyOptionsAtLocation(fromLocation);
  const sellOptions = await getSellOptionsAtLocation(toLocation);

  if (DEBUG_ROUTE) {
    console.log(`[ROUTE][core] Buy options (${buyOptions.length}):`, buyOptions.map(x => x.commodity_name));
    console.log(`[ROUTE][core] Sell options (${sellOptions.length}):`, sellOptions.map(x => x.commodity_name));
  }

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

  if (DEBUG_ROUTE){
    console.log('[ROUTE][core] Paired prices:', paired.map(p => ({
      name: p.commodity_name,
      buy: p.buyPrice,
      sell: p.sellPrice,
      profit: p.sellPrice - p.buyPrice
    })));
    console.log(`[ROUTE][core] Matched ${paired.length} commodities for profit calculation.`);
  }

  const profitOptions = calculateProfitOptions(paired, Infinity, null);
  if (!profitOptions.length) {
    if (DEBUG_ROUTE) console.warn(`[ROUTE][core] No profitable trades found.`);
    return { error: `🔍 No profitable trades found from **${fromLocation}** to **${toLocation}**.` };
  }

  const embed = buildBestTradesEmbed(fromLocation, profitOptions);
  if (DEBUG_ROUTE) console.log(`[ROUTE][core] Returning embed with ${profitOptions.length} results.`);

  return { embed };
}

async function handleTradeRoute(interaction, client, { from, to }) {
  if (DEBUG_ROUTE) console.log(`[ROUTE][execute] Running for user=${interaction.user.tag}, from=${from}, to=${to}`);
  await interaction.deferReply({ ephemeral: true });

  const allFromMatches = await getBuyOptionsAtLocation(from);
  const allToMatches = await getSellOptionsAtLocation(to);

  if (DEBUG_ROUTE) {
    console.log(`[ROUTE][execute] Raw buy matches: ${allFromMatches.length}`);
    console.log(`[ROUTE][execute] Raw sell matches: ${allToMatches.length}`);
    console.log('[ROUTE][debug] First fromMatch terminal:', allFromMatches[0]?.terminal);

  }

  const fromTerminals = allFromMatches.map(opt => opt.terminal).filter(Boolean);
  const toTerminals = allToMatches.map(opt => opt.terminal).filter(Boolean);
  
  const fromTerminal = resolveBestMatchingTerminal(from, fromTerminals);
  const toTerminal = resolveBestMatchingTerminal(to, toTerminals);
  
  if (DEBUG_ROUTE) {
    console.log('[ROUTE][execute] Matched from terminal:', fromTerminal?.name ?? '❌ None');
    console.log('[ROUTE][execute] Matched to terminal:', toTerminal?.name ?? '❌ None');
  }
  
  if (!fromTerminal || !toTerminal) {
    return safeReply(interaction, {
      content: `❌ Could not confidently resolve one or both locations: "${from}" or "${to}".`,
      flags: MessageFlags.Ephemeral
    });
  }
  
  const fromResolved = fromTerminal.name;
  const toResolved = toTerminal.name;

  if (DEBUG_ROUTE) console.log(`[ROUTE][execute] Using resolved locations: from=${fromResolved}, to=${toResolved}`);

  const result = await handleTradeRouteCore({ fromLocation: fromResolved, toLocation: toResolved });

  if (result.error) {
    if (DEBUG_ROUTE) console.warn(`[ROUTE][execute] Error: ${result.error}`);
    return safeReply(interaction, { content: result.error, flags: MessageFlags.Ephemeral });
  }

  if (DEBUG_ROUTE) console.log(`[ROUTE][execute] Success — sending embed.`);
  return safeReply(interaction, { embeds: [result.embed] });
}

module.exports = {
  handleTradeRoute
};
