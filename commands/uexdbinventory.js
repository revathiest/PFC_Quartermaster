const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const {
  UexItemPrice,
  UexCommodityPrice,
  UexFuelPrice,
  UexVehiclePurchasePrice,
  UexVehicleRentalPrice
} = require('../config/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uexdbinventory')
    .setDescription('View UEX inventory from the database')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('Enter a terminal/location name')
        .setRequired(true)
    ),

  async execute(interaction) {
    const location = interaction.options.getString('location');

    await interaction.deferReply({ ephemeral: true });

    const datasets = await Promise.all([
      UexItemPrice.findAll({ where: { terminal_name: location } }),
      UexCommodityPrice.findAll({ where: { terminal_name: location } }),
      UexFuelPrice.findAll({ where: { terminal_name: location } }),
      UexVehiclePurchasePrice.findAll({ where: { terminal_name: location } }),
      UexVehicleRentalPrice.findAll({ where: { terminal_name: location } })
    ]);

    const [items, commodities, fuel, purchases, rentals] = datasets;

    const options = [];
    if (items.length) options.push({ label: 'Items', value: 'items' });
    if (commodities.length) options.push({ label: 'Commodities', value: 'commodities' });
    if (fuel.length) options.push({ label: 'Fuel', value: 'fuel' });
    if (purchases.length) options.push({ label: 'Vehicle Purchases', value: 'purchases' });
    if (rentals.length) options.push({ label: 'Vehicle Rentals', value: 'rentals' });

    if (!options.length) {
      return interaction.editReply(`❌ No inventory found at **${location}**.`);
    }

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`select_inventory_type:${location}`)
        .setPlaceholder('Select inventory type')
        .addOptions(options)
    );

    await interaction.editReply({
      content: `📍 Found inventory at **${location}**. Choose a type:`,
      components: [selectMenu]
    });
  },

  async handleSelect(interaction) {
    const [prefix, location] = interaction.customId.split(':');
    const selectedType = interaction.values[0];

    const tableMap = {
      items: UexItemPrice,
      commodities: UexCommodityPrice,
      fuel: UexFuelPrice,
      purchases: UexVehiclePurchasePrice,
      rentals: UexVehicleRentalPrice
    };

    const table = tableMap[selectedType];
    if (!table || !location) {
      return interaction.reply({ content: 'Invalid selection or missing location.', ephemeral: true });
    }

    const records = await table.findAll({ where: { terminal_name: location } });

    if (!records.length) {
      return interaction.update({ content: `❌ No ${selectedType} inventory found at **${location}**.`, components: [], embeds: [] });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} at ${location}`)
      .setColor(0x00bfff)
      .setDescription(
        records.map(entry => {
          if (entry.item_name) return `**${entry.item_name}**: ${entry.price_buy} aUEC`;
          if (entry.commodity_name) return `**${entry.commodity_name}**: ${entry.price_sell ?? entry.price_buy} aUEC`;
          if (entry.vehicle_name) return `**${entry.vehicle_name}**: ${entry.price_buy ?? entry.price_rent} aUEC`;
          return 'Unknown entry';
        }).slice(0, 20).join('\n')
      )
      .setFooter({ text: `Results truncated to 20 entries` });

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`make_public:${selectedType}:${location}`)
        .setLabel('📢 Make Public')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.update({ embeds: [embed], components: [actionRow] });
  },

  async handleButton(interaction) {
    const [, selectedType, location] = interaction.customId.split(':');

    const tableMap = {
      items: UexItemPrice,
      commodities: UexCommodityPrice,
      fuel: UexFuelPrice,
      purchases: UexVehiclePurchasePrice,
      rentals: UexVehicleRentalPrice
    };

    const table = tableMap[selectedType];
    if (!table || !location) {
      return interaction.reply({ content: 'Invalid button or missing context.', ephemeral: true });
    }

    const records = await table.findAll({ where: { terminal_name: location } });

    const embed = new EmbedBuilder()
      .setTitle(`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} at ${location}`)
      .setColor(0x00bfff)
      .setDescription(
        records.map(entry => {
          if (entry.item_name) return `**${entry.item_name}**: ${entry.price_buy} aUEC`;
          if (entry.commodity_name) return `**${entry.commodity_name}**: ${entry.price_sell ?? entry.price_buy} aUEC`;
          if (entry.vehicle_name) return `**${entry.vehicle_name}**: ${entry.price_buy ?? entry.price_rent} aUEC`;
          return 'Unknown entry';
        }).slice(0, 20).join('\n')
      )
      .setFooter({ text: `Results truncated to 20 entries` });

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};