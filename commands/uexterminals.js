const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
  } = require('discord.js');
  const { Op } = require('sequelize');
  const db = require('../config/database');
  
  // We'll pass this to the button handler
  function buildTerminalEmbed(location, matches) {
    // Group terminals by type
    const grouped = {};
    for (const term of matches) {
      const type = term.type || 'unknown';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(term);
    }
  
    const embed = new EmbedBuilder()
      .setTitle(`📍 Terminals in: ${location}`)
      .setColor(0x00bcd4)
      .setFooter({ text: `Found ${matches.length} terminal(s)` })
      .setTimestamp();
  
    const descriptionParts = [];
  
    for (const [type, terminals] of Object.entries(grouped)) {
      descriptionParts.push(`**🔹 ${type.charAt(0).toUpperCase() + type.slice(1)} Terminals**`);
      for (const term of terminals) {
        const label = term.name || term.nickname || term.code;
        const locationLabel =
          term.space_station_name || term.orbit_name || term.planet_name || 'Unknown location';
        descriptionParts.push(`• \`${term.code}\` - **${label}** at *${locationLabel}*`);
      }
      descriptionParts.push('');
    }
  
    embed.setDescription(descriptionParts.join('\n'));
    return embed;
  }
  
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
        order: [['type', 'ASC'], ['name', 'ASC']],
        limit: 100
      });
  
      if (matches.length === 0) {
        return interaction.reply({
          content: `❌ No terminals found matching "${location}".`,
          ephemeral: true
        });
      }
  
      const embed = buildTerminalEmbed(location, matches);
  
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`make_public::${location}`)
          .setLabel('📢 Make Public')
          .setStyle(ButtonStyle.Primary)
      );
  
      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    },
  
    // Handle the button
    async button(interaction, client) {
      const [prefix, location] = interaction.customId.split('::');
  
      if (prefix !== 'make_public') return;
  
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
        order: [['type', 'ASC'], ['name', 'ASC']],
        limit: 100
      });
  
      if (matches.length === 0) {
        return interaction.update({
          content: `❌ Terminals not found or data unavailable.`,
          components: [],
          embeds: [],
          ephemeral: true
        });
      }
  
      const embed = buildTerminalEmbed(location, matches);
  
      return interaction.channel.send({
        content: `Here are the public terminals for **${location}**:`,
        embeds: [embed]
      });
    }
  };
  