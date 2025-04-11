// File: commands/uexfinditem.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { Op } = require('sequelize');
const ItemsPricesAll = require('../models/itemsPrices');
const CommoditiesPricesAll = require('../models/commoditiesPrices');
const VehiclesPurchasesPricesAll = require('../models/vehiclesPurchasesPrices');
const UexTerminal = require('../models/uexTerminal');
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
    const query = interaction.options.getString('description');
    await interaction.deferReply({ ephemeral: true });

    const [items, commodities, vehicles] = await Promise.all([
      ItemsPricesAll.findAll({
        where: { description: { [Op.like]: `%${query}%` } },
        limit: 25
      }),
      CommoditiesPricesAll.findAll({
        where: { description: { [Op.like]: `%${query}%` } },
        limit: 25
      }),
      VehiclesPurchasesPricesAll.findAll({
        where: { name: { [Op.like]: `%${query}%` } },
        limit: 25
      })
    ]);

    const results = [
      ...items.map(i => ({ type: 'item', id: i.item_id, label: `🧪 ${i.description}` })),
      ...commodities.map(c => ({ type: 'commodity', id: c.commodity_id, label: `💰 ${c.description}` })),
      ...vehicles.map(v => ({ type: 'vehicle', id: v.vehicle_id, label: `🚀 ${v.name}` }))
    ];

    if (results.length === 0) {
      return interaction.editReply('No matches found. Try refining your search, love.');
    } else if (results.length === 1) {
      return handleSelection(interaction, results[0]);
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('uexfinditem-select')
      .setPlaceholder('Select the item you meant')
      .addOptions(results.map(res => ({
        label: res.label,
        value: `${res.type}:${res.id}`
      })));

    const row = new ActionRowBuilder().addComponents(selectMenu);
    return interaction.editReply({ content: 'Multiple matches found:', components: [row] });
  },

  async handleSelect(interaction) {
    const [type, id] = interaction.values[0].split(':');
    await handleSelection(interaction, { type, id });
  }
};

async function handleSelection(interaction, selection) {
  const { type, id } = selection;
  let records;

  switch (type) {
    case 'item':
      records = await ItemsPricesAll.findAll({
        where: { item_id: id },
        include: { model: UexTerminal, as: 'terminal' },
        order: [['price', 'ASC']]
      });
      break;
    case 'commodity':
      records = await CommoditiesPricesAll.findAll({
        where: { commodity_id: id },
        include: { model: UexTerminal, as: 'terminal' },
        order: [['price', 'ASC']]
      });
      break;
    case 'vehicle':
      records = await VehiclesPurchasesPricesAll.findAll({
        where: { vehicle_id: id },
        include: { model: UexTerminal, as: 'terminal' },
        order: [['price', 'ASC']]
      });
      break;
  }

  if (!records || records.length === 0) {
    return interaction.editReply('No location data found for that entry.');
  }

  const embed = buildUexAvailabilityEmbed(type, records);
  return interaction.editReply({ embeds: [embed], components: [] });
}
