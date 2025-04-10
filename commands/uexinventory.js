// uexinventory.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { Op } = require('sequelize');
const db = require('../config/database');
const fetch = require('node-fetch');

const TerminalEndpointMap = {
  commodity: 'commodities_prices',
  item: 'items_prices',
  vehicle_buy: 'vehicles_purchases_prices',
  vehicle_rent: 'vehicle_rental_prices',
  refinery: 'commodities_prices',
  fuel: 'fuel_prices'
};

const PAGE_SIZE = 10;

function chunkItems(items, size = PAGE_SIZE) {
  const pages = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

async function fetchInventoryData(terminal) {
  const endpoint = TerminalEndpointMap[terminal.type];
  if (!endpoint) return null;
  const url = `https://api.uexcorp.space/2.0/${endpoint}?id_terminal=${terminal.id}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || [];
}

async function buildInventoryEmbed(terminal, items, page = 0) {
  const endpoint = TerminalEndpointMap[terminal.type];
  const chunks = chunkItems(items);
  const current = chunks[page] || [];

  const embed = new EmbedBuilder()
    .setTitle(`📦 Inventory: ${terminal.name}`)
    .setDescription(`Page ${page + 1}/${chunks.length} • ${endpoint.replace(/_/g, ' ')}`)
    .setFooter({ text: `Terminal ID: ${terminal.id} • Version: ${terminal.game_version || 'N/A'}` })
    .setColor(0x0088cc)
    .setTimestamp();

  for (const item of current) {
    const name = item.item_name || item.vehicle_name || item.commodity_name || 'Unnamed';
    const value = [
      item.price_buy !== undefined ? `Buy: ${item.price_buy} UEC` : null,
      item.price_sell !== undefined ? `Sell: ${item.price_sell} UEC` : null,
      item.price_rent !== undefined ? `Rent: ${item.price_rent} UEC` : null,
      item.scu_sell_stock !== undefined ? `SCU: ${item.scu_sell_stock}` : null,
      item.durability !== undefined ? `Durability: ${item.durability}%` : null
    ].filter(Boolean).join('\n');
    embed.addFields({ name, value, inline: true });
  }

  return { embed, pageCount: chunks.length };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uexinventory')
    .setDescription('Browse UEX terminal inventory by location')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('Planet, station, or city name')
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

    const types = [...new Set(terminals.map(t => t.type).filter(type => TerminalEndpointMap[type]))];
    if (!types.length) {
      return interaction.reply({ content: `❌ No supported terminal types at "${location}".`, ephemeral: true });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId(`uexinv_type::${location}`)
      .setPlaceholder('Select a terminal type')
      .addOptions(types.map(type => ({ label: type.replace('_', ' '), value: type })));

    const row = new ActionRowBuilder().addComponents(select);
    return interaction.reply({ content: `Found ${terminals.length} terminals at **${location}**.`, components: [row], ephemeral: true });
  },

  option: async (interaction) => {
    const [prefix, location] = interaction.customId.split('::');
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
      }
    });

    if (!terminals.length) {
      return interaction.update({ content: `❌ No terminals of type \`${selectedType}\` at **${location}**.`, components: [] });
    }

    if (terminals.length === 1) {
      const items = await fetchInventoryData(terminals[0]);
      const { embed } = await buildInventoryEmbed(terminals[0], items);
      return interaction.update({ embeds: [embed], components: [] });
    }

    const terminalSelect = new StringSelectMenuBuilder()
      .setCustomId(`uexinv_terminal_select::${selectedType}::${location}`)
      .setPlaceholder('Select a terminal')
      .addOptions(terminals.slice(0, 25).map(t => ({ label: t.name, value: t.id.toString() })));

    const row = new ActionRowBuilder().addComponents(terminalSelect);
    return interaction.update({ content: `Terminals of type \`${selectedType}\` at **${location}**:`, components: [row] });
  },

  button: async (interaction) => {
    // Placeholder — to be implemented for pagination and publish button.
  }
};
