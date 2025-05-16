const DEBUG_EMBED = false; // 🔥 toggle debug logs on/off
const { EmbedBuilder } = require('discord.js');

function buildBestTradesEmbed(fromLocation, profitOptions, shipName) {
  try {
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] buildBestTradesEmbed → fromLocation=${fromLocation}, shipName=${shipName}`);
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] profitOptions input:`, profitOptions);

    const title = shipName
      ? `🚀 Best trades from ${fromLocation} using ${shipName}`
      : `🚀 Best trades from ${fromLocation}`;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`Top ${profitOptions.length} profitable commodities:`)
      .addFields(
        profitOptions.slice(0, 5).map((opt, index) => {
          if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] [Best] mapping option #${index}:`, opt);
          return {
            name: `${opt.commodity}: ${opt.fromTerminal} → ${opt.toTerminal}`,
            value: [
              `Profit/SCU: **${opt.profitPerSCU}**`,
              `ROI: **${opt.returnOnInvestment}**`,
              opt.cargoUsed !== null ? `Cargo: **${opt.cargoUsed} SCU**` : `Cargo: *No ship selected*`,
              opt.totalProfit !== null ? `Total: **${opt.totalProfit}**` : `Total: *N/A*`
            ].join('\n'),
            inline: false
          };
        })
      )
      .setFooter({ text: 'Prices subject to change in-game.' });

    return embed;
  } catch (err) {
    console.error(`[TRADE EMBEDS] buildBestTradesEmbed encountered an error:`, err);
    return new EmbedBuilder().setTitle('❌ Failed to build trade embed.');
  }
}

function buildRouteEmbed(commodity, fromLocation, sellOptions) {
  try {
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] buildRouteEmbed → commodity=${commodity}, fromLocation=${fromLocation}`);
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] sellOptions input:`, sellOptions);

    const fields = sellOptions.slice(0, 5).map((opt, index) => {
      if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] [Route] mapping option #${index}:`, opt);
      return {
        name: `${opt.toTerminal ?? 'UNKNOWN_TERMINAL'} (${opt.location ?? 'UNKNOWN_LOCATION'})`,
        value: `Sell Price: **${opt.sellPrice ?? 'N/A'}**\nProfit/SCU: **${opt.profitPerSCU ?? 'N/A'}**`,
        inline: false
      };
    });

    const embed = new EmbedBuilder()
      .setTitle(`🚚 Best sell locations for ${commodity} from ${fromLocation}`)
      .addFields(fields)
      .setFooter({ text: 'Prices are estimates only.' });

    return embed;
  } catch (err) {
    console.error(`[TRADE EMBEDS] buildRouteEmbed encountered an error:`, err);
    return new EmbedBuilder().setTitle('❌ Failed to build route embed.');
  }
}

function buildCircuitEmbed(outbound, returnTrip, fromLocation) {
  try {
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] buildCircuitEmbed → fromLocation=${fromLocation}`);
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] outbound:`, outbound);
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] returnTrip:`, returnTrip);

    const outboundField = {
      name: `Outbound: Buy ${outbound.commodity ?? 'UNKNOWN_COMMODITY'} → Sell at ${outbound.terminal ?? 'UNKNOWN_TERMINAL'}`,
      value: `Profit/SCU: **${outbound.profitPerSCU ?? 'N/A'}**\nCargo: **${outbound.cargoUsed ?? 'N/A'} SCU**\nTotal: **${outbound.totalProfit ?? 'N/A'}**`,
      inline: false
    };

    const returnField = returnTrip ? {
      name: `Return: Buy ${returnTrip.commodity ?? 'UNKNOWN_COMMODITY'} → Sell back at ${fromLocation}`,
      value: `Profit/SCU: **${returnTrip.profitPerSCU ?? 'N/A'}**\nCargo: **${returnTrip.cargoUsed ?? 'N/A'} SCU**\nTotal: **${returnTrip.totalProfit ?? 'N/A'}**`,
      inline: false
    } : {
      name: 'Return:',
      value: '❌ No profitable return cargo found.',
      inline: false
    };

    const embed = new EmbedBuilder()
      .setTitle(`🔄 Trade circuit from ${fromLocation}`)
      .addFields([outboundField, returnField])
      .setFooter({ text: 'Loop route calculated based on current prices.' });

    return embed;
  } catch (err) {
    console.error(`[TRADE EMBEDS] buildCircuitEmbed encountered an error:`, err);
    return new EmbedBuilder().setTitle('❌ Failed to build circuit embed.');
  }
}

function buildPriceEmbed(commodity, location, priceOptions) {
  try {
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] buildPriceEmbed → commodity=${commodity}, location=${location}`);
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] priceOptions input:`, priceOptions);

    const fields = priceOptions.slice(0, 5).map((opt, index) => {
      if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] [Price] mapping option #${index}:`, opt);
      return {
        name: `${opt.toTerminal ?? 'UNKNOWN_TERMINAL'}`,
        value: `Buy: **${opt.buyPrice ?? 'N/A'}** | Sell: **${opt.sellPrice ?? 'N/A'}**`,
        inline: false
      };
    });

    const embed = new EmbedBuilder()
      .setTitle(`💰 Prices for ${commodity}${location ? ` at ${location}` : ''}`)
      .addFields(fields)
      .setFooter({ text: 'Prices from latest available data.' });

    return embed;
  } catch (err) {
    console.error(`[TRADE EMBEDS] buildPriceEmbed encountered an error:`, err);
    return new EmbedBuilder().setTitle('❌ Failed to build price embed.');
  }
}

function buildShipEmbed(ship) {
  try {
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] buildShipEmbed → ship:`, ship);

    const embed = new EmbedBuilder()
      .setTitle(`🚢 Ship info: ${ship.name ?? 'UNKNOWN_NAME'}`)
      .setDescription(`Cargo Capacity: **${ship.scu ?? 'N/A'} SCU**\nType: ${ship.is_cargo ? 'Cargo' : 'Non-cargo'}`)
      .setFooter({ text: 'Ship data from database.' });

    return embed;
  } catch (err) {
    console.error(`[TRADE EMBEDS] buildShipEmbed encountered an error:`, err);
    return new EmbedBuilder().setTitle('❌ Failed to build ship embed.');
  }
}

function buildLocationsEmbed(terminals) {
  try {
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] buildLocationsEmbed → terminals:`, terminals);

    const fields = terminals.slice(0, 10).map((t, index) => {
      if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] [Locations] mapping terminal #${index}:`, t);
      return {
        name: `${t.name ?? 'UNKNOWN_TERMINAL'}`,
        value: `${t.city_name ?? t.planet_name ?? 'Unknown'}`,
        inline: false
      };
    });

    const embed = new EmbedBuilder()
      .setTitle(`📍 Known trade terminals`)
      .addFields(fields);

    return embed;
  } catch (err) {
    console.error(`[TRADE EMBEDS] buildLocationsEmbed encountered an error:`, err);
    return new EmbedBuilder().setTitle('❌ Failed to build locations embed.');
  }
}

function buildCommoditiesEmbed(commodities) {
  try {
    if (DEBUG_EMBED) console.log(`[TRADE EMBEDS] buildCommoditiesEmbed → commodities:`, commodities);

    const embed = new EmbedBuilder()
      .setTitle(`📦 Known commodities`)
      .setDescription(commodities.join(', '))
      .setFooter({ text: 'Commodity list from database.' });

    return embed;
  } catch (err) {
    console.error(`[TRADE EMBEDS] buildCommoditiesEmbed encountered an error:`, err);
    return new EmbedBuilder().setTitle('❌ Failed to build commodities embed.');
  }
}

module.exports = {
  buildBestTradesEmbed,
  buildRouteEmbed,
  buildCircuitEmbed,
  buildPriceEmbed,
  buildShipEmbed,
  buildLocationsEmbed,
  buildCommoditiesEmbed
};
