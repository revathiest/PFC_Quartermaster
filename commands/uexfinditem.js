// File: commands/uexfinditem.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Op } = require('sequelize');

const {
  UexItemPrice,
  UexCommodityPrice,
  UexVehiclePurchasePrice,
  UexTerminal
} = require('../config/database');

const PAGE_SIZE = 20;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uexfinditem')
    .setDescription('Find all locations selling a specific item, commodity, or vehicle')
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Enter part of the item/commodity/vehicle name')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('description');
    console.log(`[DEBUG] /uexfinditem query: ${query}`);
    await interaction.deferReply({ ephemeral: true });

    const [items, commodities, vehicles] = await Promise.all([
      UexItemPrice.findAll({
        where: { item_name: { [Op.like]: `%${query}%` } },
        limit: 50
      }),
      UexCommodityPrice.findAll({
        where: { commodity_name: { [Op.like]: `%${query}%` } },
        limit: 50
      }),
      UexVehiclePurchasePrice.findAll({
        where: { vehicle_name: { [Op.like]: `%${query}%` } },
        limit: 50
      })
    ]);

    console.log(`[DEBUG] Found items: ${items.length}, commodities: ${commodities.length}, vehicles: ${vehicles.length}`);

    const itemMap = new Map();
    const commodityMap = new Map();
    const vehicleMap = new Map();

    items.forEach(i => {
      if (!itemMap.has(i.item_name)) {
        itemMap.set(i.item_name, { type: 'item', id: i.id_item, label: `🧪 ${i.item_name}` });
      }
    });

    commodities.forEach(c => {
      if (!commodityMap.has(c.commodity_name)) {
        commodityMap.set(c.commodity_name, { type: 'commodity', id: c.id_commodity, label: `💰 ${c.commodity_name}` });
      }
    });

    vehicles.forEach(v => {
      if (!vehicleMap.has(v.vehicle_name)) {
        vehicleMap.set(v.vehicle_name, { type: 'vehicle', id: v.id_vehicle, label: `🚀 ${v.vehicle_name}` });
      }
    });

    const results = [
      ...itemMap.values(),
      ...commodityMap.values(),
      ...vehicleMap.values()
    ];

    console.log(`[DEBUG] Total unique results: ${results.length}`);

    if (results.length === 0) {
      return interaction.editReply('No matches found. Try refining your search, love.');
    } else if (results.length === 1) {
      return handleSelection(interaction, results[0], 0, interaction);
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('uexfinditem-select')
      .setPlaceholder('Select the item you meant')
      .addOptions(results.map((res, index) => ({
        label: res.label,
        value: `${res.type}:${res.id}:${index}`
      })));

    const row = new ActionRowBuilder().addComponents(selectMenu);
    return interaction.editReply({ content: 'Multiple matches found:', components: [row] });
  },

  async handleSelect(interaction) {
    console.log(`[DEBUG] handleSelect triggered: values =`, interaction.values);
    const [type, id] = interaction.values[0].split(':');
    console.log(`[DEBUG] Parsed type: ${type}, id: ${id}`);

    await interaction.deferReply({ ephemeral: true });

    await handleSelection(interaction, { type, id: parseInt(id, 10) }, 0, interaction);
  },

  async button(interaction) {
    const [prefix, type, id, pageStr] = interaction.customId.split('::');
    const page = parseInt(pageStr, 10);
    await interaction.deferUpdate();
    await handleSelection(interaction, { type, id: parseInt(id, 10) }, page, interaction);
  },

  option: async function(interaction, client) {
    return module.exports.handleSelect(interaction, client);
  }
};

async function handleSelection(interaction, selection, page = 0, sourceInteraction) {
  const { type, id } = selection;
  console.log(`[DEBUG] handleSelection for type: ${type}, id: ${id}`);
  let records;

  switch (type) {
    case 'item':
      records = await UexItemPrice.findAll({
        where: { id_item: id },
        include: { model: UexTerminal, as: 'terminal' },
        order: [['price_buy', 'ASC']]
      });
      break;
    case 'commodity':
      records = await UexCommodityPrice.findAll({
        where: { id_commodity: id },
        include: { model: UexTerminal, as: 'terminal' },
        order: [['price_buy', 'ASC']]
      });
      break;
    case 'vehicle':
      records = await UexVehiclePurchasePrice.findAll({
        where: { id_vehicle: id },
        include: { model: UexTerminal, as: 'terminal' },
        order: [['price_buy', 'ASC']]
      });
      break;
  }

  console.log(`[DEBUG] Retrieved records: ${records?.length}`);

  if (!records || records.length === 0) {
    return interaction.editReply('No location data found for that entry.');
  }

  const filtered = records.filter(record => (record.price_buy > 0 || record.price_sell > 0));
  const chunks = [];
  for (let i = 0; i < filtered.length; i += PAGE_SIZE) {
    chunks.push(filtered.slice(i, i + PAGE_SIZE));
  }
  const chunk = chunks[page] || [];

  const rows = chunk.map(record => {
    const location = (record.terminal?.name || record.terminal_name || 'Unknown').padEnd(26).slice(0, 26);
    const buy = record.price_buy > 0 ? record.price_buy.toLocaleString().padStart(8) : '     N/A';
    const sell = record.price_sell > 0 ? record.price_sell.toLocaleString().padStart(8) : '     N/A';
    return `| ${location} | ${buy} | ${sell} |`;
  });

  const header = '| Location                   |      Buy |     Sell |';
  const divider = '|----------------------------|----------|----------|';
  const table = '```markdown\n' + [header, divider, ...rows].join('\n') + '\n```';

  const embed = new EmbedBuilder()
    .setTitle('Availability')
    .setDescription(table)
    .setFooter({ text: `Page ${page + 1} of ${chunks.length}` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`uexfinditem::${type}::${id}::${page - 1}`)
      .setLabel('◀️ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`uexfinditem::${type}::${id}::${page + 1}`)
      .setLabel('▶️ Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= chunks.length - 1)
  );

  return interaction.editReply({ embeds: [embed], components: [buttons] });
}