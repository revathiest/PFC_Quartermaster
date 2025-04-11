// File: commands/uexfinditem.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { Op } = require('sequelize');

const {
  UexItemPrice,
  UexCommodityPrice,
  UexVehiclePurchasePrice,
  UexTerminal
} = require('../config/database');

const { buildUexAvailabilityEmbed } = require('../components/embedBuilders/uexAvailabilityEmbed');

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
    console.log('[COMMAND] /uexfinditem invoked');
    const query = interaction.options.getString('description');
    console.log('[DEBUG] Search query:', query);
    await interaction.deferReply({ ephemeral: true });

    console.log('[DEBUG] Searching UexItemPrice, UexCommodityPrice, and UexVehiclePurchasePrice');
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
      console.log('[DEBUG] Item i.id:', i.id);
      console.log('[DEBUG] Item i.item_name:', i.item_name);
      console.log('[DEBUG] Item i.id_item:', i.id_item);
      console.log('[DEBUG] Item row:', i.toJSON());
      if (!itemMap.has(i.item_name)) {
        itemMap.set(i.item_name, { type: 'item', id: i.id_item, label: `🧪 ${i.item_name}` });
      }
    });

    commodities.forEach(c => {
      console.log('[DEBUG] Commodity c.id:', c.id);
      console.log('[DEBUG] Commodity c.commodity_name:', c.commodity_name);
      console.log('[DEBUG] Commodity c.id_commodity:', c.id_commodity);
      console.log('[DEBUG] Commodity row:', c.toJSON());
      if (!commodityMap.has(c.commodity_name)) {
        commodityMap.set(c.commodity_name, { type: 'commodity', id: c.id_commodity, label: `💰 ${c.commodity_name}` });
      }
    });

    vehicles.forEach(v => {
      console.log('[DEBUG] Vehicle v.id:', v.id);
      console.log('[DEBUG] Vehicle v.vehicle_name:', v.vehicle_name);
      console.log('[DEBUG] Vehicle v.id_vehicle:', v.id_vehicle);
      console.log('[DEBUG] Vehicle row:', v.toJSON());
      if (!vehicleMap.has(v.vehicle_name)) {
        vehicleMap.set(v.vehicle_name, { type: 'vehicle', id: v.id_vehicle, label: `🚀 ${v.vehicle_name}` });
      }
    });

    console.log('[DEBUG] itemMap keys:', Array.from(itemMap.keys()));
    console.log('[DEBUG] commodityMap keys:', Array.from(commodityMap.keys()));
    console.log('[DEBUG] vehicleMap keys:', Array.from(vehicleMap.keys()));

    const results = [
      ...itemMap.values(),
      ...commodityMap.values(),
      ...vehicleMap.values()
    ];

    if (results.length === 0) {
      console.log('[DEBUG] No matches found after filtering.');
      return interaction.editReply('No matches found. Try refining your search, love.');
    } else if (results.length === 1) {
      console.log('[DEBUG] One unique result found:', results[0]);
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
    console.log('[DEBUG] Multiple unique matches found. Presenting select menu:', results);
    return interaction.editReply({ content: 'Multiple matches found:', components: [row] });
  },

  async handleSelect(interaction) {
    console.log('[DEBUG] Raw selection value:', interaction.values[0]);
    const [type, id] = interaction.values[0].split(':');
    console.log('[DEBUG] Parsed type:', type, '| Parsed id:', id);

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
  console.log('[DEBUG] handleSelection called with:', { type, id });

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

  console.log('[DEBUG] Retrieved records:', records);
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

  console.log('[DEBUG] Building embed with type:', type, 'and records count:', records.length);
  return interaction.editReply({ embeds: [embed], components: [] });
}
