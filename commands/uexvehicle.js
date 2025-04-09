const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const db = require('../config/database');

function buildVehicleEmbed(vehicle) {
  return new EmbedBuilder()
    .setTitle(`🛠️ ${vehicle.name_full || vehicle.name}`)
    .setDescription(vehicle.slug ? `Slug: \`${vehicle.slug}\`` : null)
    .addFields(
      { name: 'Crew', value: vehicle.crew || 'Unknown', inline: true },
      { name: 'Cargo', value: `${vehicle.scu || 0} SCU`, inline: true },
      { name: 'Mass', value: `${vehicle.mass || 0} kg`, inline: true },
      { name: 'Dimensions', value: `${vehicle.length}m x ${vehicle.width}m x ${vehicle.height}m`, inline: false },
      { name: 'Fuel', value: `Quantum: ${vehicle.fuel_quantum || 0} | Hydrogen: ${vehicle.fuel_hydrogen || 0}`, inline: false }
    )
    .setFooter({ text: `Vehicle ID: ${vehicle.id}` })
    .setColor(0x0088cc)
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uexvehicle')
    .setDescription('Search UEX vehicles by name')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Part or full name of the vehicle')
        .setRequired(true)
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name');

    const matches = await db.UexVehicle.findAll({
      where: {
        name: {
          [db.Sequelize.Op.like]: `%${name}%`
        }
      },
      limit: 25
    });

    if (matches.length === 0) {
      return interaction.reply({ content: `No vehicles found matching "${name}".`, ephemeral: true });
    }

    if (matches.length === 1) {
      const embed = buildVehicleEmbed(matches[0]);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('uexvehicle_select')
      .setPlaceholder('Select a vehicle')
      .addOptions(matches.map(v => ({
        label: v.name.slice(0, 100),
        description: v.name_full?.slice(0, 100) || undefined,
        value: String(v.id)
      })));

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: `Found ${matches.length} vehicles. Please choose one:`,
      components: [row],
      ephemeral: true
    });
  },

  async option(interaction) {
    const selectedId = interaction.values[0];
    const vehicle = await db.UexVehicle.findByPk(selectedId);

    if (!vehicle) {
      return interaction.update({ content: 'That vehicle could not be found.', components: [] });
    }

    const embed = buildVehicleEmbed(vehicle);
    await interaction.update({ content: null, embeds: [embed], components: [] });
  }
};
