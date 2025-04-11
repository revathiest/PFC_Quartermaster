// File: commands/uexfinditem.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { Op } = require('sequelize');

const {
  UexItemPrice,
  UexCommodityPrice,
  UexVehiclePurchasePrice,
  UexTerminal
} = require('../config/database');

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

    if (results.length === 0) {
      return interaction.editReply('No matches found. Try refining your search, love.');
    } else if (results.length === 1) {
      return handleSelection(interaction, results[0]);
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
    const [type, id] = interaction.values[0].split(':');

    await interaction.deferReply({ ephemeral: true });

    await handleSelection(interaction, { type, id: parseInt(id, 10) });
  },

  option: async function(interaction, client) {
    return module.exports.handleSelect(interaction, client);
  }
};

async function handleSelection(interaction, selection) {
  const { type, id } = selection;
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

  if (!records || records.length === 0) {
    return interaction.editReply('No location data found for that entry.');
  }

  const locations = [];
  const prices = [];

  records.forEach(record => {
    if (!record.price_buy || record.price_buy <= 0) return;
    locations.push(record.terminal_name || record.terminal?.name || 'Unknown');
    prices.push(`${record.price_buy} aUEC`);
  });

  const fields = [
    { name: 'Location', value: locations.join('\n'), inline: true },
    { name: 'Price', value: prices.join('\n'), inline: true }
  ];

  const embed = new EmbedBuilder()
    .setTitle('Availability')
    .addFields(fields);

  return interaction.editReply({ embeds: [embed], components: [] });
}
