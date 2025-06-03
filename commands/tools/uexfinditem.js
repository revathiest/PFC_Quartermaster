// File: commands/uexfinditem.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { Op } = require('sequelize');

const {
  UexItemPrice,
  UexCommodityPrice,
  UexVehiclePurchasePrice,
  UexTerminal
} = require('../../config/database');
const { isUserVerified } = require('../../utils/verifyGuard');

const PAGE_SIZE = 20;

const formatPrice = (val) => (val > 0 ? val.toLocaleString().padStart(8) : '     N/A');
const getLocation = (rec) => (rec.terminal?.name || rec.terminal_name || 'Unknown').padEnd(26).slice(0, 26);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uexfinditem')
    .setDescription('Find all locations selling a specific item, commodity, or vehicle')
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Enter part of the item/commodity/vehicle name')
        .setRequired(true)
    ),
  help: "Find all locations where you can buy or sell a specific item, commodity or vehicle.",
  category: "Star Citizen",

  async execute(interaction) {

    if (!(await isUserVerified(interaction.user.id))) {
      return interaction.reply({
        content: '❌ You must verify your RSI profile using `/verify` before using this command.',
        flags: MessageFlags.Ephemeral
      });
    }
    
    const query = interaction.options.getString('description');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [items, commodities, vehicles] = await Promise.all([
      UexItemPrice.findAll({
        where: { item_name: { [Op.like]: `%${query}%` } },
      }),
      UexCommodityPrice.findAll({
        where: { commodity_name: { [Op.like]: `%${query}%` } },
      }),
      UexVehiclePurchasePrice.findAll({
        where: { vehicle_name: { [Op.like]: `%${query}%` } },
      })
    ]);

    const itemMap = new Map();
    const commodityMap = new Map();
    const vehicleMap = new Map();

    items.forEach(i => {
      itemMap.set(i.item_name, { type: 'item', id: i.id_item, label: `🧪 ${i.item_name}` });
    });

    commodities.forEach(c => {
      commodityMap.set(c.commodity_name, { type: 'commodity', id: c.id_commodity, label: `💰 ${c.commodity_name}` });
    });

    vehicles.forEach(v => {
      vehicleMap.set(v.vehicle_name, { type: 'vehicle', id: v.id_vehicle, label: `🚀 ${v.vehicle_name}` });
    });

    const results = [
      ...itemMap.values(),
      ...commodityMap.values(),
      ...vehicleMap.values()
    ];

    if (results.length === 0) {
      return interaction.editReply('No matches found. Try refining your search.');
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

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
  const modelMap = {
    item: UexItemPrice,
    commodity: UexCommodityPrice,
    vehicle: UexVehiclePurchasePrice
  };
  const model = modelMap[type];
  const idField = type === 'item' ? 'id_item' : type === 'commodity' ? 'id_commodity' : 'id_vehicle';
  const records = model ? await model.findAll({
    where: { [idField]: id },
    include: { model: UexTerminal, as: 'terminal' },
    order: [['price_buy', 'ASC']]
  }) : [];

  if (records.length === 0) {
    return interaction.editReply('No location data found for that entry.');
  }

  const filtered = records.filter(record => (record.price_buy > 0 || record.price_sell > 0));
  const chunkCount = Math.ceil(filtered.length / PAGE_SIZE);
  const chunks = Array.from({ length: chunkCount }, (_, idx) => filtered.slice(idx * PAGE_SIZE, idx * PAGE_SIZE + PAGE_SIZE));
  const chunk = chunks[page] || [];

  const rows = chunk.map(record => `| ${getLocation(record)} | ${formatPrice(record.price_buy)} | ${formatPrice(record.price_sell)} |`);

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