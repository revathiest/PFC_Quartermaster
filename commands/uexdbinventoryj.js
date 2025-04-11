const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const {
  UexItemPrice,
  UexCommodityPrice,
  UexFuelPrice,
  UexVehiclePurchasePrice,
  UexVehicleRentalPrice
} = require('../config/database'); // Adjusted relative path

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
        .setCustomId('select_inventory_type')
        .setPlaceholder('Select inventory type')
        .addOptions(options)
    );

    await interaction.editReply({
      content: `📍 Found inventory at **${location}**. Choose a type:`,
      components: [selectMenu]
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.customId === 'select_inventory_type' && i.user.id === interaction.user.id,
      time: 15000,
      max: 1
    });

    collector.on('collect', async selectInteraction => {
      const type = selectInteraction.values[0];
      let records = [];
      let title = '';

      switch (type) {
        case 'items':
          records = items;
          title = 'Items';
          break;
        case 'commodities':
          records = commodities;
          title = 'Commodities';
          break;
        case 'fuel':
          records = fuel;
          title = 'Fuel';
          break;
        case 'purchases':
          records = purchases;
          title = 'Vehicle Purchases';
          break;
        case 'rentals':
          records = rentals;
          title = 'Vehicle Rentals';
          break;
      }

      const embed = new EmbedBuilder()
        .setTitle(`${title} at ${location}`)
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
          .setCustomId('make_public')
          .setLabel('📢 Make Public')
          .setStyle(ButtonStyle.Primary)
      );

      await selectInteraction.update({
        embeds: [embed],
        components: [actionRow]
      });

      const btnCollector = interaction.channel.createMessageComponentCollector({
        filter: b => b.customId === 'make_public' && b.user.id === interaction.user.id,
        time: 15000,
        max: 1
      });

      btnCollector.on('collect', async btn => {
        await btn.reply({ embeds: [embed], ephemeral: false });
      });
    });
  }
};