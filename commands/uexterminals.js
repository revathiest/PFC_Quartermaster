const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Op } = require('sequelize');
const db = require('../config/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uexterminals')
    .setDescription('List all UEX terminals at a specific location')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('System, planet, or station name')
        .setRequired(true)
    ),

  async execute(interaction) {
    const location = interaction.options.getString('location');
    const locationFilter = { [Op.like]: `%${location}%` };

    const matches = await db.UexTerminal.findAll({
      where: {
        [Op.or]: [
          { star_system_name: locationFilter },
          { planet_name: locationFilter },
          { orbit_name: locationFilter },
          { space_station_name: locationFilter },
          { outpost_name: locationFilter },
          { city_name: locationFilter }
        ]
      },
      limit: 25 // keep it Discord-safe
    });

    if (matches.length === 0) {
      return interaction.reply({
        content: `❌ No terminals found matching "${location}". Try a system, planet, or station name.`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📍 Terminals for: ${location}`)
      .setColor(0x2196f3)
      .setFooter({ text: `Showing ${matches.length} result(s)` })
      .setTimestamp();

    embed.setDescription(
      matches.map(term => {
        const name = term.name || term.nickname || term.code;
        const station = term.space_station_name || term.orbit_name || 'Unknown location';
        const type = term.type || 'unknown';
        return `• **${name}** (${term.code}) — *${station}*, type: \`${type}\``;
      }).join('\n')
    );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
