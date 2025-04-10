const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { Op } = require('sequelize');
const db = require('../config/database');
const fetch = require('node-fetch');

const TerminalEndpointMap = {
  commodity: 'commodities_prices',
  item: 'items_prices',
  vehicle_buy: 'vehicles_purchases_prices',
  vehicle_rent: 'vehicles_rentals_prices',
  commodity_raw: 'commodities_raw_prices',
  refinery: 'commodities_prices',
  fuel: 'fuel_prices'
};

const PAGE_SIZE = 10;

function chunkInventory(items) {
  const pages = [];
  for (let i = 0; i < items.length; i += PAGE_SIZE) {
    pages.push(items.slice(i, i + PAGE_SIZE));
  }
  return pages;
}

async function fetchInventoryEmbed(interaction, terminal, page = 0, isPublic = false) {
  console.log(`[DEBUG] Fetching inventory embed with terminal:`, terminal);
  console.log(`[DEBUG] Page: ${page}, isPublic: ${isPublic}`);

  const endpoint = TerminalEndpointMap[terminal.type];
  if (!endpoint) {
    console.warn(`[WARN] No endpoint for terminal type: ${terminal.type}`);
    return interaction.reply({
      content: `❌ No inventory data available for terminal type: \`${terminal.type}\`.`,
      ephemeral: !isPublic
    });
  }

  const url = `https://api.uexcorp.space/2.0/${endpoint}?id_terminal=${terminal.id}`;
  console.log(`[DEBUG] Fetch URL: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[ERROR] Fetch failed: ${res.status} ${res.statusText}`);
    return interaction.reply({
      content: `❌ Failed to retrieve inventory data for terminal: \`${terminal.name}\`.`,
      ephemeral: !isPublic
    });
  }

  const json = await res.json();
  const items = json?.data;
  console.log(`[DEBUG] Items received: ${Array.isArray(items)}, Count: ${items?.length}`);

  if (!Array.isArray(items) || items.length === 0) {
    return interaction.reply({
      content: `❌ No inventory data found for terminal \`${terminal.name}\`.`,
      ephemeral: !isPublic
    });
  }

  const chunks = chunkInventory(items);
  const chunk = chunks[page];
  console.log(`[DEBUG] Chunk length: ${chunk.length}, Page count: ${chunks.length}`);

  const embed = new EmbedBuilder()
    .setTitle(`📦 Inventory: ${terminal.name}`)
    .setFooter({ text: `Terminal ID: ${terminal.id} • Game Version: ${terminal.game_version || 'N/A'}` })
    .setColor(0x0088cc)
    .setTimestamp();

  if (endpoint === 'items_prices') {
    console.log(`[DEBUG] Formatting items_prices table with ${chunk.length} items`);
    const header = `| Item                      |     Buy |    Sell |\n|---------------------------|---------|---------|`;
    const rows = chunk.map(item =>
      `| ${item.item_name.padEnd(25)} | ${String(item.price_buy ?? 'N/A').padStart(7)} | ${String(item.price_sell ?? 'N/A').padStart(7)} |`
    );
    const table = '```markdown\n' + [header, ...rows].join('\n') + '\n```';
    embed.setDescription(table);
  }

  if (endpoint === 'commodities_prices') {
    console.log(`[DEBUG] Formatting commodities_prices`);
    embed.addFields(chunk.map(item => ({
      name: item.commodity_name,
      value: `Buy: ${item.price_buy ?? 'N/A'} UEC\nSell: ${item.price_sell ?? 'N/A'} UEC\nSCU: ${item.scu_sell_stock ?? 'N/A'}`,
      inline: true
    })));
  }

  if (endpoint === 'fuel_prices') {
    console.log(`[DEBUG] Formatting fuel_prices`);
    embed.addFields(chunk.map(item => ({
      name: item.commodity_name,
      value: `Buy: ${item.price_buy ?? 'N/A'} UEC`,
      inline: true
    })));
  }

  if (endpoint === 'vehicle_rental_prices') {
    console.log(`[DEBUG] Formatting vehicle_rental_prices`);
    embed.addFields(chunk.map(item => ({
      name: item.terminal_name,
      value: `Rent: ${item.price_rent ?? 'N/A'} UEC`,
      inline: true
    })));
  }

  if (endpoint === 'vehicles_purchases_prices') {
    console.log(`[DEBUG] Formatting vehicles_purchases_prices`);
    embed.addFields(chunk.map(item => ({
      name: item.vehicle_name || 'Unknown Vehicle',
      value: `Buy: ${item.price_buy ?? 'N/A'} UEC`,
      inline: true
    })));
  }

  const components = [];

  if (chunks.length > 1) {
    const navButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`uexinv_prev::${terminal.id}::${page}`)
        .setLabel('◀️ Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId(`uexinv_next::${terminal.id}::${page}`)
        .setLabel('▶️ Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === chunks.length - 1)
    );
    components.push(navButtons);
  }

  if (!isPublic) {
    const publishButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`uexinv_public::${terminal.id}::${page}`)
        .setLabel('📢 Make Public')
        .setStyle(ButtonStyle.Primary)
    );
    components.push(publishButton);
  }

  const payload = {
    embeds: [embed],
    components,
    ephemeral: !isPublic
  };

  console.log(`[DEBUG] Sending embed payload. Replied: ${interaction.replied}, Deferred: ${interaction.deferred}`);

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply(payload);
  } else {
    await interaction.reply(payload);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uexinventory')
    .setDescription('Browse terminal inventory by location')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('Planet, station, or system')
        .setRequired(true)
    ),

  async execute(interaction) {
    const location = interaction.options.getString('location');
    const locationFilter = { [Op.like]: `%${location}%` };

    console.log(`[DEBUG] Location selected: ${location}`);
    console.log(`[DEBUG] Sequelize location filter:`, locationFilter);

    const terminals = await db.UexTerminal.findAll({
      where: {
        [Op.or]: [
          { star_system_name: locationFilter },
          { planet_name: locationFilter },
          { orbit_name: locationFilter },
          { space_station_name: locationFilter },
          { outpost_name: locationFilter },
          { city_name: locationFilter }
        ]
      }
    });

    console.log(`[DEBUG] Terminals found: ${terminals.length}`);

    if (!terminals.length) {
      return interaction.reply({ content: `❌ No terminals found at "${location}".`, ephemeral: true });
    }

    const types = [...new Set(terminals.map(t => t.type).filter(Boolean))];
    console.log(`[DEBUG] Terminal types:`, types);

    const select = new StringSelectMenuBuilder()
      .setCustomId(`uexinv_type::${location}`)
      .setPlaceholder('Select a terminal type')
      .addOptions(types.map(t => ({ label: t, value: t })));

    const row = new ActionRowBuilder().addComponents(select);

    return interaction.reply({
      content: `Found **${terminals.length}** terminals at **${location}**. Choose a type:`,
      components: [row],
      ephemeral: true
    });
  },

  option: async (interaction) => {
    const parts = interaction.customId.split('::');
    const prefix = parts[0];
    const selectedType = parts[1];
    const location = parts.slice(2).join('::');

    console.log(`[DEBUG] Option handler triggered.`);
    console.log(`[DEBUG] Parsed interaction: prefix=${prefix}, type=${selectedType}, location=${location}`);

    const locationFilter = { [Op.like]: `%${location}%` };
    console.log(`[DEBUG] Sequelize location filter:`, locationFilter);

    const terminals = await db.UexTerminal.findAll({
      where: {
        type: selectedType,
        [Op.or]: [
          { star_system_name: locationFilter },
          { planet_name: locationFilter },
          { orbit_name: locationFilter },
          { space_station_name: locationFilter },
          { outpost_name: locationFilter },
          { city_name: locationFilter }
        ]
      },
      order: [['name', 'ASC']]
    });

    console.log(`[DEBUG] Terminals matching query: ${terminals.length}`);

    if (!terminals.length) {
      return interaction.update({
        content: `❌ No terminals of type \`${selectedType}\` found at **${location}**.`,
        components: [],
        ephemeral: true
      });
    }

    if (terminals.length === 1) {
      return fetchInventoryEmbed(interaction, terminals[0]);
    }

    const terminalOptions = terminals.slice(0, 25).map(term => ({
      label: term.name || term.nickname || term.code,
      value: `uexinv_terminal::${term.id}`
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`uexinv_terminal_menu::${selectedType}::${location}`)
        .setPlaceholder('Select a terminal')
        .addOptions(terminalOptions)
    );

    return interaction.update({
      content: `Terminals of type \`${selectedType}\` at **${location}**:`,
      components: [row],
      embeds: [],
      ephemeral: true
    });
  },

  button: async (interaction) => {
    const [action, terminalId, pageStr] = interaction.customId.split('::');
    const page = parseInt(pageStr, 10);
    const terminal = await db.UexTerminal.findByPk(terminalId);
    console.log(`[DEBUG] Button interaction. Action=${action}, TerminalID=${terminalId}, Page=${page}`);

    if (!terminal) {
      console.error(`[ERROR] Terminal not found in DB for ID: ${terminalId}`);
      return interaction.reply({ content: '❌ Terminal not found.', ephemeral: true });
    }

    const newPage = action === 'uexinv_prev' ? page - 1 : action === 'uexinv_next' ? page + 1 : page;
    const isPublic = action === 'uexinv_public';

    console.log(`[DEBUG] Resolved newPage=${newPage}, isPublic=${isPublic}`);

    return fetchInventoryEmbed(interaction, terminal, newPage, isPublic);
  }
};