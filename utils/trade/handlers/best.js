const DEBUG_TRADE = false;

const { getBuyOptionsAtLocation, getVehicleByName, getSellPricesForCommodityElsewhere } = require('../tradeQueries');
const { calculateProfitOptions } = require('../tradeCalculations');
const { buildBestTradesEmbed } = require('../tradeEmbeds');
const { buildShipSelectMenu } = require('../tradeComponents');
const { safeReply, TradeStateCache } = require('./shared');

// =======================================
// Core handler that returns embed/error/components
async function handleTradeBestCore({ fromLocation, shipQuery, cash, userId }) {
  if (DEBUG_TRADE) {
    console.log(`[TRADE CORE] start`, { fromLocation, shipQuery, cash });
  }

  try {
    let vehicles = [];
    if (shipQuery) {
      vehicles = await getVehicleByName(shipQuery);
    }

    if (shipQuery && vehicles.length === 0) {
      return { error: `❌ No ships found matching **${shipQuery}**.` };
    }

    if (vehicles.length > 1) {
      if (!userId) {
        return { error: '❌ Multiple ships matched, and no userId provided for caching.' };
      }

      TradeStateCache.set(userId, { fromLocation, shipQuery, cash });

      const row = buildShipSelectMenu(vehicles, 'trade::best::select_ship');
      return {
        error: `Multiple ships matched **${shipQuery}**. Please select one:`,
        components: [row]
      };
    }

    const ship = vehicles[0] || null;
    const shipSCU = ship?.scu ?? 0;

    const buyOptions = await getBuyOptionsAtLocation(fromLocation);

    const paired = [];
    for (const b of buyOptions) {
      if (!b.price_buy || b.price_buy <= 0) continue;

      const sells = await getSellPricesForCommodityElsewhere(b.commodity_name, fromLocation);

      for (const s of sells) {
        if (!s.price_sell || s.price_sell <= 0) continue;
        paired.push({
          commodity_name: b.commodity_name,
          buyPrice: b.price_buy,
          sellPrice: s.price_sell,
          scu_buy: b.scu_buy,
          terminal: b.terminal,
          sellTerminal: s.terminal,
          location: s.terminal.city_name ?? s.terminal.planet_name
        });
      }
    }

    const profitOptions = calculateProfitOptions(paired, shipSCU, cash);

    if (!profitOptions.length) {
      return { error: `❌ No profitable trades found from **${fromLocation}**.` };
    }

    const embed = buildBestTradesEmbed(fromLocation, profitOptions, ship?.name);
    return { embed };

  } catch (err) {
    console.error(`[TRADE CORE] Error`, err);
    return { error: `⚠️ An error occurred processing your request.` };
  }
}

// =======================================
// /trade best — slash command only
async function handleTradeBest(interaction, client, { fromLocation, shipQuery, cash }) {
  const { embed, error, components } = await handleTradeBestCore({
    fromLocation,
    shipQuery,
    cash,
    userId: interaction.user.id
  });

  // Ship select menu case
  if (components) {
    return safeReply(interaction, {
      content: error,
      components,
      ephemeral: true
    });
  }

  if (error) {
    return safeReply(interaction, { content: error, ephemeral: true });
  }

  return safeReply(interaction, { embeds: [embed] });
}

module.exports = {
  handleTradeBestCore,
  handleTradeBest
};