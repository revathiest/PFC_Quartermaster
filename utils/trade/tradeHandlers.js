const DEBUG_TRADE = false;

const {
  getSellOptionsAtLocation,
  getBuyOptionsAtLocation,
  getCommodityTradeOptions,
  getVehicleByName,
  getAllShipNames,
  getReturnOptions,
  getTerminalsAtLocation,
  getSellPricesForCommodityElsewhere
} = require('./tradeQueries');

const {
  calculateProfitOptions,
  calculateCircuitTotalProfit
} = require('./tradeCalculations');

const {
  buildBestTradesEmbed,
  buildRouteEmbed,
  buildCircuitEmbed,
  buildPriceEmbed,
  buildShipEmbed,
  buildLocationsEmbed,
  buildCommoditiesEmbed
} = require('./tradeEmbeds');

const {
  buildShipSelectMenu
} = require('./tradeComponents')

const pendingBest = new Map();

// =======================================
// /trade best
async function handleTradeBest(interaction, client, { fromLocation, shipQuery, cash }) {
  if (DEBUG_TRADE) {
    console.log(
      `[TRADE HANDLERS][handleTradeBest] start`,
      { user: interaction.user.tag, fromLocation, shipQuery, cash }
    );
  }

  try {
    // 1) Lookup variants if a query was provided
    let vehicles = [];
    if (shipQuery) {
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Looking up vehicles for "${shipQuery}"…`);
      vehicles = await getVehicleByName(shipQuery);
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] getVehicleByName → found ${vehicles.length} variant(s)`);
    }

    // 2) If user asked for a ship but none found → error
    if (shipQuery && vehicles.length === 0) {
      if (DEBUG_TRADE) console.warn(`[TRADE HANDLERS] No vehicles match "${shipQuery}"`);
      return interaction.reply({
        content: `❌ No ships found matching **${shipQuery}**.`,
        ephemeral: true
      });
    }

    // 3) Ambiguous (more than one) → cache the parameters & show a select menu
    if (vehicles.length > 1) {
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Ambiguous ship, caching request for ${interaction.user.tag}`);
      pendingBest.set(interaction.user.id, { fromLocation, shipQuery, cash });

      const row = buildShipSelectMenu(vehicles, 'trade::best::select_ship');
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Sending ship select menu`);
      return interaction.reply({
        content: `Multiple ships matched **${shipQuery}**. Please select one:`,
        components: [row],
        flags: 1 << 6 // ephemeral
      });
    }

    // 4) Single match (or no shipQuery) → proceed
    const ship = vehicles[0] || null;
    const shipSCU = ship?.scu ?? 0;
    if (DEBUG_TRADE) {
      console.log(
        `[TRADE HANDLERS] Selected ship:`,
        ship ? `${ship.name_full} (${shipSCU} SCU)` : 'none'
      );
    }

    // 5) Fetch buy options
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Fetching buy options at ${fromLocation}`);
    const buyOptions = await getBuyOptionsAtLocation(fromLocation);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${buyOptions.length} buy options`);

    // 6) Pair each buy with all possible sells
    const paired = [];
    for (const b of buyOptions) {
      if (!b.price_buy || b.price_buy <= 0) continue;
      if (DEBUG_TRADE) console.log(
        `[TRADE HANDLERS] Checking buy option for ${b.commodity_name} at ${b.price_buy}`
      );
      const sells = await getSellPricesForCommodityElsewhere(b.commodity_name, fromLocation);
      if (DEBUG_TRADE) console.log(
        `[TRADE HANDLERS] Found ${sells.length} sell options for ${b.commodity_name}`
      );

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
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Prepared ${paired.length} buy/sell records`);

    // 7) Calculate profit options
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Calculating profit options`);
    const profitOptions = calculateProfitOptions(paired, shipSCU, cash);
    if (DEBUG_TRADE) console.log(
      `[TRADE HANDLERS] calculateProfitOptions → ${profitOptions.length} profitable routes`
    );

    if (!profitOptions.length) {
      if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] No profitable routes`);
      return interaction.reply(`❌ No profitable trades found from **${fromLocation}**.`);
    }

    // 8) Build & send the embed
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Building embed and replying`);
    const embed = buildBestTradesEmbed(fromLocation, profitOptions, ship?.name);
    return interaction.reply({ embeds: [embed] });

  } catch (err) {
    console.error(`[TRADE HANDLERS][handleTradeBest] error:`, err);
    if (!interaction.replied) {
      return interaction.reply(`⚠️ An error occurred processing your request.`);
    }
  }
}

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
      await interaction.reply(`❌ No sell options found for **${commodityName}** from **${fromLocation}**.`);
      return;
    }

    const embed = buildRouteEmbed(commodityName, fromLocation, sellOptions);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for route`);
    await interaction.reply({ embeds: [embed] });

  } catch (err) {
    console.error(`[TRADE HANDLERS] handleTradeRoute error:`, err);
    if (!interaction.replied) await interaction.reply(`⚠️ An error occurred processing your request.`);
  }
}

// =======================================
// /trade circuit
async function handleTradeBestCircuit(interaction) {
  try {
    const fromLocation = interaction.options.getString('from');
    const shipName = interaction.options.getString('with');
    const cash = interaction.options.getInteger('cash') ?? 100000;
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeBestCircuit → fromLocation=${fromLocation}, shipName=${shipName}, cash=${cash}`);

    const ship = shipName ? await getVehicleByName(shipName) : { scu: 66 };
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Retrieved ship:`, ship);

    const outboundOptions = await getSellOptionsAtLocation(fromLocation);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${outboundOptions.length} outbound sellOptions`);

    const outboundProfits = calculateProfitOptions(outboundOptions, ship.scu, cash);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Calculated ${outboundProfits.length} outbound profits`);

    if (!outboundProfits.length) {
      console.warn(`[TRADE HANDLERS] No outbound profits from ${fromLocation}`);
      await interaction.reply(`❌ No outbound profitable trades from **${fromLocation}**.`);
      return;
    }

    const topOutbound = outboundProfits[0];
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Top outbound trade:`, topOutbound);

    const returnOptions = await getReturnOptions(fromLocation, topOutbound.terminal);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${returnOptions.length} returnOptions`);

    const returnProfits = calculateProfitOptions(returnOptions, ship.scu, cash);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Calculated ${returnProfits.length} return profits`);

    const topReturn = returnProfits.length ? returnProfits[0] : null;
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Top return trade:`, topReturn);

    const embed = buildCircuitEmbed(topOutbound, topReturn, fromLocation);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for circuit`);
    await interaction.reply({ embeds: [embed] });

  } catch (err) {
    console.error(`[TRADE HANDLERS] handleTradeBestCircuit error:`, err);
    if (!interaction.replied) await interaction.reply(`⚠️ An error occurred processing your request.`);
  }
}

// =======================================
// /trade find
async function handleTradeFind(interaction) {
  try {
    const fromLocation = interaction.options.getString('from');
    const toLocation = interaction.options.getString('to');
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeFind → fromLocation=${fromLocation}, toLocation=${toLocation}`);

    const sellOptions = await getSellOptionsAtLocation(fromLocation);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${sellOptions.length} sellOptions from ${fromLocation}`);

    const filtered = sellOptions.filter(o =>
      o.terminal && (o.terminal.name === toLocation || o.terminal.city_name === toLocation)
    );
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Filtered down to ${filtered.length} options matching toLocation`);

    if (!filtered.length) {
      console.warn(`[TRADE HANDLERS] No trades found from ${fromLocation} to ${toLocation}`);
      await interaction.reply(`❌ No trades found from **${fromLocation}** to **${toLocation}**.`);
      return;
    }

    const profitOptions = calculateProfitOptions(filtered, 66, 100000);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Calculated ${profitOptions.length} profits`);

    const embed = buildBestTradesEmbed(`${fromLocation} → ${toLocation}`, profitOptions);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for trade find`);
    await interaction.reply({ embeds: [embed] });

  } catch (err) {
    console.error(`[TRADE HANDLERS] handleTradeFind error:`, err);
    if (!interaction.replied) await interaction.reply(`⚠️ An error occurred processing your request.`);
  }
}

// =======================================
// /trade price
async function handleTradePrice(interaction) {
  try {
    const commodityName = interaction.options.getString('commodity');
    const location = interaction.options.getString('location');
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradePrice → commodityName=${commodityName}, location=${location}`);

    const priceOptions = await getCommodityTradeOptions(commodityName);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${priceOptions.length} priceOptions for ${commodityName}`);

    const filtered = location
      ? priceOptions.filter(o => o.terminal && (o.terminal.name === location || o.terminal.city_name === location))
      : priceOptions;
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Filtered down to ${filtered.length} priceOptions for location filter`);

    if (!filtered.length) {
      console.warn(`[TRADE HANDLERS] No price data found for ${commodityName} at ${location}`);
      await interaction.reply(`❌ No price data found for **${commodityName}**${location ? ` at **${location}**` : ''}.`);
      return;
    }

    const embed = buildPriceEmbed(commodityName, location, filtered);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for price`);
    await interaction.reply({ embeds: [embed] });

  } catch (err) {
    console.error(`[TRADE HANDLERS] handleTradePrice error:`, err);
    if (!interaction.replied) await interaction.reply(`⚠️ An error occurred processing your request.`);
  }
}

// =======================================
// /trade ship
async function handleTradeShip(interaction) {
  try {
    const shipName = interaction.options.getString('name');
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeShip → shipName=${shipName}`);

    const ship = await getVehicleByName(shipName);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Fetched ship:`, ship);

    if (!ship) {
      console.warn(`[TRADE HANDLERS] Ship not found: ${shipName}`);
      await interaction.reply(`❌ Ship **${shipName}** not found.`);
      return;
    }

    const embed = buildShipEmbed(ship);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for ship`);
    await interaction.reply({ embeds: [embed] });

  } catch (err) {
    console.error(`[TRADE HANDLERS] handleTradeShip error:`, err);
    if (!interaction.replied) await interaction.reply(`⚠️ An error occurred processing your request.`);
  }
}

// =======================================
// /trade locations
async function handleTradeLocations(interaction) {
  try {
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeLocations triggered`);
    const terminals = await getTerminalsAtLocation('%');
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${terminals.length} terminals`);

    if (!terminals.length) {
      console.warn(`[TRADE HANDLERS] No terminals found`);
      await interaction.reply(`❌ No known terminals.`);
      return;
    }

    const embed = buildLocationsEmbed(terminals);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for locations`);
    await interaction.reply({ embeds: [embed] });

  } catch (err) {
    console.error(`[TRADE HANDLERS] handleTradeLocations error:`, err);
    if (!interaction.replied) await interaction.reply(`⚠️ An error occurred processing your request.`);
  }
}

// =======================================
// /trade commodities
async function handleTradeCommodities(interaction) {
  try {
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] handleTradeCommodities triggered`);
    const commodities = await getAllShipNames();
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Found ${commodities.length} commodities`);

    if (!commodities.length) {
      console.warn(`[TRADE HANDLERS] No commodities found`);
      await interaction.reply(`❌ No known commodities.`);
      return;
    }

    const embed = buildCommoditiesEmbed(commodities);
    if (DEBUG_TRADE) console.log(`[TRADE HANDLERS] Built embed for commodities`);
    await interaction.reply({ embeds: [embed] });

  } catch (err) {
    console.error(`[TRADE HANDLERS] handleTradeCommodities error:`, err);
    if (!interaction.replied) await interaction.reply(`⚠️ An error occurred processing your request.`);
  }
}

module.exports = {
  handleTradeBest,
  handleTradeRoute,
  handleTradeBestCircuit,
  handleTradeFind,
  handleTradePrice,
  handleTradeShip,
  handleTradeLocations,
  handleTradeCommodities,
  pendingBest
};
