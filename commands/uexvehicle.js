const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const db = require('../config/database');
const { Op } = require('sequelize');

const VEHICLE_ROLES = {
    is_spaceship: 'Spaceship',
    is_ground_vehicle: 'Ground Vehicle',
    is_single_pilot: 'Single Pilot',
    is_multi_crew: 'Multi-Crew',
    is_combat: 'Combat',
    is_exploration: 'Exploration',
    is_industry: 'Industry',
    is_cargo: 'Cargo',
    is_refinery: 'Refinery',
    is_mining: 'Mining',
    is_salvage: 'Salvage',
    is_transport: 'Transport',
    is_medical: 'Medical',
    is_racing: 'Racing',
    is_touring: 'Touring',
    is_data: 'Data',
    is_stealth: 'Stealth',
    is_military: 'Military',
    is_civilian: 'Civilian',
    is_personal_transport: 'Personal Transport',
    is_vehicle_transport: 'Vehicle Transport',
    is_research: 'Research',
    is_pathfinder: 'Pathfinder',
    is_multirole: 'Multirole'
  };

  function buildVehicleEmbed(vehicle) {
    const embed = new EmbedBuilder()
      .setTitle(`🛠️ ${vehicle.name_full || vehicle.name}`)
      .setDescription(vehicle.slug ? `Slug: \`${vehicle.slug}\`` : null)
      .addFields(
        { name: 'Crew', value: vehicle.crew || 'Unknown', inline: true },
        { name: 'Cargo', value: `${vehicle.scu || 0} SCU`, inline: true },
        { name: 'Mass', value: `${vehicle.mass || 0} kg`, inline: true },
        { name: 'Dimensions', value: `${vehicle.length}m x ${vehicle.width}m x ${vehicle.height}m`, inline: false },
        { name: 'Fuel', value: `Quantum: ${vehicle.fuel_quantum || 0} | Hydrogen: ${vehicle.fuel_hydrogen || 0}`, inline: false }
      )
      .setFooter({
        text: `Vehicle ID: ${vehicle.id} • Game Version: ${vehicle.game_version || 'unknown'}`
      })
      .setColor(0x0088cc)
      .setTimestamp();
  
    // Optional pricing fields
    if (vehicle.pledge_cost || vehicle.ingame_cost || vehicle.rental_cost) {
      embed.addFields({
        name: 'Pricing',
        value: [
          vehicle.pledge_cost ? `💸 Pledge: ${vehicle.pledge_cost}` : null,
          vehicle.ingame_cost ? `🪙 In-Game: ${vehicle.ingame_cost}` : null,
          vehicle.rental_cost ? `🛻 Rental: ${vehicle.rental_cost}` : null
        ].filter(Boolean).join('\n'),
        inline: false
      });
    }
  
    // Optional loaners
    if (vehicle.loaners) {
      embed.addFields({
        name: 'Loaner Vehicles',
        value: vehicle.loaners,
        inline: false
      });
    }
  
    // Roles & capabilities
    const trueRoles = Object.entries(VEHICLE_ROLES)
      .filter(([key]) => vehicle[key] === true)
      .map(([, label]) => `✅ ${label}`);
  
    if (trueRoles.length) {
      embed.addFields({
        name: 'Roles & Capabilities',
        value: trueRoles.join('\n'),
        inline: false
      });
    }
  
    return embed;
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
          [Op.like]: `%${name}%`
        }
      },
      limit: 25
    });

    if (matches.length === 0) {
      return interaction.reply({ content: `No vehicles found matching "${name}".`, ephemeral: true });
    }

    if (matches.length === 1) {
      const embed = buildVehicleEmbed(matches[0]);
      return interaction.reply({ embeds: [embed], ephemeral: false });
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
      ephemeral: false
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
