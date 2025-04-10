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
  console.log(`[DEBUG] fetchInventoryEmbed called with terminal:`, terminal);
  const endpoint = TerminalEndpointMap[terminal.type];

  if (!endpoint) {
    console.warn(`[WARN] No endpoint mapped for terminal type: ${terminal.type}`);
    return interaction.reply({
      content: `❌ No inventory data available for terminal type: \`${terminal.type}\`.`,
      ephemeral: !isPublic
    });
  }

  const url = `https://api.uexcorp.space/2.0/${endpoint}?id_terminal=${terminal.id}`;
  console.log(`[DEBUG] Fetching URL: ${url}`);
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`[ERROR] Failed to fetch ${url}: ${res.statusText}`);
    return interaction.reply({
      content: `❌ Failed to retrieve inventory data for terminal: \`${terminal.name}\`.`,
      ephemeral: !isPublic
    });
  }

  const json = await res.json();
  const items = json?.data;

  if (!Array.isArray(items) || items.length === 0) {
    console.warn(`[WARN] No inventory returned for terminal ID: ${terminal.id}`);
    return interaction.reply({
      content: `❌ No inventory data found for terminal \`${terminal.name}\`.`,
      ephemeral: !isPublic
    });
  }

  console.log(`[DEBUG] Inventory length: ${items.length}`);
  const chunks = chunkInventory(items);
  const chunk = chunks[page];

  const embed = new EmbedBuilder()
    .setTitle(`📦 Inventory: ${terminal.name}`)
    .setDescription(`Showing ${endpoint.replace('_', ' ')} — Page ${page + 1}/${chunks.length}`)
    .setFooter({ text: `Terminal ID: ${terminal.id} • Game Version: ${terminal.game_version || 'N/A'}` })
    .setColor(0x0088cc)
    .setTimestamp();

  if (endpoint === 'commodities_prices') {
    embed.addFields(chunk.map(item => ({
      name: item.commodity_name,
      value: `Buy: ${item.price_buy ?? 'N/A'} UEC\nSell: ${item.price_sell ?? 'N/A'} UEC\nSCU: ${item.scu_sell_stock ?? 'N/A'}`,
      inline: true
    })));
  }

  if (endpoint === 'items_prices') {
    embed.addFields(chunk.map(item => ({
      name: item.item_name,
      value: `Buy: ${item.price_buy ?? 'N/A'} UEC\nSell: ${item.price_sell ?? 'N/A'} UEC\nDurability: ${item.durability ?? 'N/A'}%`,
      inline: true
    })));
  }

  if (endpoint === 'fuel_prices') {
    embed.addFields(chunk.map(item => ({
      name: item.commodity_name,
      value: `Buy: ${item.price_buy ?? 'N/A'} UEC`,
      inline: true
    })));
  }

  if (endpoint === 'vehicle_rental_prices') {
    embed.addFields(chunk.map(item => ({
      name: item.terminal_name,
      value: `Rent: ${item.price_rent ?? 'N/A'} UEC`,
      inline: true
    })));
  }

  if (endpoint === 'vehicles_purchases_prices') {
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

  if (interaction.replied || interaction.deferred) {
    console.log('[DEBUG] Editing interaction with updated payload');
    await interaction.editReply(payload);
  } else {
    console.log('[DEBUG] Sending initial reply with payload');
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
    console.log(`[DEBUG] Location selected: ${location}`);
    const locationFilter = { [Op.like]: `%${location}%` };

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
    const [prefix, selectedType, location] = interaction.customId.split('::');
    console.log(`[DEBUG] Option handler called for type=${selectedType}, location=${location}`);

    if (prefix === 'uexinv_type') {
      const locationFilter = { [Op.like]: `%${location}%` };
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

      console.log(`[DEBUG] Matching terminals: ${terminals.length}`);

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
    }

    if (interaction.values[0].startsWith('uexinv_terminal::')) {
      const terminalId = interaction.values[0].split('::')[1];
      console.log(`[DEBUG] Fetching inventory for terminal ID: ${terminalId}`);
      const terminal = await db.UexTerminal.findByPk(terminalId);
      if (!terminal) {
        return interaction.update({
          content: `❌ Could not find terminal with ID ${terminalId}.`,
          components: [],
          ephemeral: true
        });
      }
      return fetchInventoryEmbed(interaction, terminal);
    }
  },

  button: async (interaction) => {
    const [action, terminalId, pageStr] = interaction.customId.split('::');
    const page = parseInt(pageStr, 10);
    console.log(`[DEBUG] Button clicked: ${action}, terminalId: ${terminalId}, page: ${page}`);
    const terminal = await db.UexTerminal.findByPk(terminalId);
    if (!terminal) {
      return interaction.reply({ content: '❌ Terminal not found.', ephemeral: true });
    }

    const newPage = action === 'uexinv_prev' ? page - 1 : action === 'uexinv_next' ? page + 1 : page;
    const isPublic = action === 'uexinv_public';
    return fetchInventoryEmbed(interaction, terminal, newPage, isPublic);
  }
};