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
  refinery: 'commodities_prices', // optionally /refineries_audits
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
  console.log(`[LOG] Fetching inventory for terminal ${terminal.name} (ID: ${terminal.id}), page ${page}`);
  
  const endpoint = TerminalEndpointMap[terminal.type];
  if (!endpoint) {
    console.error(`[ERROR] No endpoint found for terminal type: ${terminal.type}`);
    return interaction.reply({
      content: `❌ No inventory data available for terminal type: \`${terminal.type}\`.`,
      ephemeral: !isPublic
    });
  }

  console.log(`[LOG] Querying endpoint: ${endpoint} for terminal ID ${terminal.id}`);
  const url = `https://api.uexcorp.space/2.0/${endpoint}?id_terminal=${terminal.id}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`[ERROR] Failed to fetch from ${url}: ${res.statusText}`);
    return interaction.reply({
      content: `❌ Failed to retrieve inventory data for terminal: \`${terminal.name}\`.`,
      ephemeral: !isPublic
    });
  }

  const json = await res.json();
  const items = json?.data;

  if (!Array.isArray(items) || items.length === 0) {
    console.warn(`[WARN] No items found for terminal ${terminal.name} at ${terminal.id}`);
    return interaction.reply({
      content: `❌ No inventory data found for terminal \`${terminal.name}\`.`,
      ephemeral: !isPublic
    });
  }

  const chunks = chunkInventory(items);
  const chunk = chunks[page];

  const embed = new EmbedBuilder()
    .setTitle(`📦 Inventory: ${terminal.name}`)
    .setDescription(`Showing ${endpoint.replace('_', ' ')} — Page ${page + 1}/${chunks.length}`)
    .setFooter({ text: `Terminal ID: ${terminal.id} • Game Version: ${terminal.game_version || 'N/A'}` })
    .setColor(0x0088cc)
    .setTimestamp();

  // Handling different endpoint formats
  if (endpoint === 'commodities_prices') {
    embed.addFields(chunk.map(item => ({
      name: item.commodity_name,
      value: `Buy: ${item.price_buy ?? 'N/A'} UEC\nSell: ${item.price_sell ?? 'N/A'} UEC\nSCU Available: ${item.scu_sell_stock ?? 'N/A'}`,
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

  const navButtons = new ActionRowBuilder();
  if (chunks.length > 1) {
    navButtons.addComponents(
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
  }

  const publishButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`uexinv_public::${terminal.id}::${page}`)
      .setLabel('📢 Make Public')
      .setStyle(ButtonStyle.Primary)
  );

  if (navButtons.components.length) components.push(navButtons);
  if (!isPublic) components.push(publishButton);

  const payload = {
    embeds: [embed],
    components,
    ephemeral: !isPublic
  };

  if (interaction.replied || interaction.deferred) {
    console.log('[LOG] Editing reply with updated inventory embed');
    await interaction.editReply(payload);
  } else {
    console.log('[LOG] Sending initial reply with inventory embed');
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
    console.log(`[LOG] User requested inventory for location: ${location}`);

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

    if (!terminals.length) {
      console.log(`[LOG] No terminals found for location: ${location}`);
      return interaction.reply({ content: `❌ No terminals found at "${location}".`, ephemeral: true });
    }

    const types = [...new Set(terminals.map(t => t.type).filter(Boolean))];
    console.log(`[LOG] Found terminal types: ${types.join(', ')}`);

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
    try {
      console.log('[DEBUG] Received select menu interaction');
      console.log('[DEBUG] customId:', interaction.customId);
      console.log('[DEBUG] values:', interaction.values);
  
      const [prefix, arg1, arg2] = interaction.customId.split('::');
      console.log(`[DEBUG] Parsed prefix: ${prefix}, arg1: ${arg1}, arg2: ${arg2}`);
  
      // If user selected terminal TYPE
      if (prefix === 'uexinv_type') {
        const selectedType = interaction.values[0];
        const location = arg1;
        console.log(`[LOG] User selected terminal type: ${selectedType} at ${location}`);
  
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
  
        console.log(`[DEBUG] Found ${terminals.length} terminals`);
  
        if (terminals.length === 0) {
          return interaction.update({
            content: `❌ No terminals of type \`${selectedType}\` found at **${location}**.`,
            components: [],
            ephemeral: true
          });
        }
  
        if (terminals.length === 1) {
          console.log('[DEBUG] Only one terminal found — sending directly to inventory embed');
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
  
        console.log('[DEBUG] Sending terminal list select menu');
        return interaction.update({
          content: `Terminals of type \`${selectedType}\` at **${location}**:`,
          components: [row],
          embeds: [],
          ephemeral: true
        });
      }
  
      // If user selected a specific terminal
      if (interaction.values[0].startsWith('uexinv_terminal::')) {
        const terminalId = interaction.values[0].split('::')[1];
        console.log(`[LOG] User selected terminal ID: ${terminalId}`);
  
        const terminal = await db.UexTerminal.findByPk(terminalId);
        if (!terminal) {
          console.warn(`[WARN] No terminal found with ID: ${terminalId}`);
          return interaction.update({
            content: `❌ Could not find terminal with ID ${terminalId}.`,
            components: [],
            ephemeral: true
          });
        }
  
        console.log('[DEBUG] Fetching inventory for terminal:', terminal.name);
        return fetchInventoryEmbed(interaction, terminal);
      }
  
      // Unhandled or unknown interaction
      console.warn(`[WARN] Unhandled interaction — no matching handler`);
      await interaction.reply({
        content: '❌ Unrecognized selection.',
        ephemeral: true
      });
  
    } catch (err) {
      console.error('[ERROR] Failed to handle select menu interaction:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Something went wrong handling your selection.', ephemeral: true });
      }
    }
  },  

  button: async (interaction) => {
    const [action, terminalId, pageStr] = interaction.customId.split('::');
    const currentPage = parseInt(pageStr, 10) || 0;
  
    const terminal = await db.UexTerminal.findByPk(terminalId);
    if (!terminal) {
      console.log(`[ERROR] Terminal not found for ID: ${terminalId}`);
      return interaction.reply({ content: '❌ Terminal not found.', ephemeral: true });
    }
  
    const endpoint = TerminalEndpointMap[terminal.type];
    if (!endpoint) {
      console.log(`[ERROR] No endpoint for terminal type: ${terminal.type}`);
      return interaction.reply({ content: '❌ Unknown terminal type.', ephemeral: true });
    }
  
    // Fetch the total number of items
    const url = `https://api.uexcorp.space/2.0/${endpoint}?id_terminal=${terminal.id}`;
    const res = await fetch(url);
    const json = await res.json();
    const items = Array.isArray(json?.data) ? json.data : [];
  
    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const clampedPage = Math.max(0, Math.min(
      action === 'uexinv_prev' ? currentPage - 1 :
      action === 'uexinv_next' ? currentPage + 1 : currentPage,
      totalPages - 1
    ));
  
    const isPublic = action === 'uexinv_public';
  
    return fetchInventoryEmbed(interaction, terminal, clampedPage, isPublic);
  }
  
};
