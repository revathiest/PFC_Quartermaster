const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { Op } = require('sequelize');
const db = require('../config/database');
const fetch = require('node-fetch');

const TerminalEndpointMap = {
  commodity: 'commodities_prices',
  refinery: 'commodities_prices',
  cargo_center: 'commodities_prices',
  shop_fps: 'items_prices',
  shop_vehicle: 'items_prices',
  food: 'items_prices',
  medical: 'items_prices',
  refuel: 'fuel_prices',
  fuel: 'fuel_prices',
  rental: 'vehicle_rental_prices'
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
  const endpoint = TerminalEndpointMap[terminal.type];
  if (!endpoint) {
    return interaction.reply({
      content: `❌ No inventory data available for terminal type: \`${terminal.type}\`.`,
      ephemeral: !isPublic
    });
  }

  const url = `https://api.uexcorp.space/2.0/${endpoint}?id_terminal=${terminal.id}`;
  const res = await fetch(url);
  const json = await res.json();

  const items = json?.data;
  if (!Array.isArray(items) || items.length === 0) {
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

  embed.addFields(chunk.map(item => ({
    name: item.commodity_name || item.item_name || 'Unknown',
    value: `Buy: ${item.price_buy ?? 'N/A'} UEC\nSell: ${item.price_sell ?? 'N/A'} UEC`,
    inline: true
  })));

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
      return interaction.reply({ content: `❌ No terminals found at "${location}".`, ephemeral: true });
    }

    const types = [...new Set(terminals.map(t => t.type).filter(Boolean))];

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
    const [prefix, location] = interaction.customId.split('::');
    if (prefix !== 'uexinv_type') return;

    const selectedType = interaction.values[0];
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

    if (terminals.length === 0) {
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

    await interaction.update({
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
    if (!terminal) {
      return interaction.reply({ content: '❌ Terminal not found.', ephemeral: true });
    }

    const newPage = action === 'uexinv_prev' ? page - 1 : action === 'uexinv_next' ? page + 1 : page;
    const isPublic = action === 'uexinv_public';

    return fetchInventoryEmbed(interaction, terminal, newPage, isPublic);
  }
};
