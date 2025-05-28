const { EmbedBuilder } = require('discord.js');

function buildBestTradesEmbed(fromLocation, profitOptions, shipName) {
  try {

    const title = shipName
      ? `🚀 Best trades from ${fromLocation} using ${shipName}`
      : `🚀 Best trades from ${fromLocation}`;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`Top ${profitOptions.length} profitable commodities:`)
      .addFields(
        profitOptions.slice(0, 5).map((opt, index) => {
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

    const fields = sellOptions.slice(0, 5).map((opt, index) => {
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

    const fields = priceOptions.slice(0, 5).map((opt, index) => {
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

    const fields = terminals.slice(0, 10).map((t, index) => {
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

const NAME_WIDTH = 22; // width of the commodity column

function buildCommoditiesEmbed(location, terminals, page = 0, totalPages = 1) {
  try {

    const fields = terminals.slice(0, 25).map(t => {
      const lines = t.commodities
        .map(c => {
          const buy = c.buyPrice ?? 'N/A';
          const sell = c.sellPrice ?? 'N/A';
          let name = String(c.name);
          if (name.length > NAME_WIDTH) {
            name = name.slice(0, NAME_WIDTH - 1) + '…';
          }
          name = name.padEnd(NAME_WIDTH, ' ');
          return `${name} | ${String(buy).padStart(7, ' ')} | ${String(sell).padStart(7, ' ')}`;
        })
        .join('\n');

      let content = lines.trim();
      const maxContentLength = 1017; // account for wrapping backticks
      if (content.length > maxContentLength) {
        content = `${content.slice(0, maxContentLength - 3)}...`;
      }
      const value = `\`\`\`\n${content}\`\`\``;

      return {
        name: t.terminal,
        value: value || 'No commodities found',
        inline: false
      };
    });

    const embed = new EmbedBuilder()
      .setTitle(`📦 Commodity prices at ${location}`)
      .addFields(fields)
      .setFooter({ text: `Page ${page + 1} of ${totalPages} • Prices from latest available data.` });

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
