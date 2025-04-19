const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const { Op } = require('sequelize');
const db = require('../config/database');
const { fn, col, where } = require('sequelize');
const { isUserVerified } = require('../utils/verifyGuard');

const PAGE_SIZE = 15;

function chunkArray(array, size) {
  const pages = [];
  for (let i = 0; i < array.length; i += size) {
    pages.push(array.slice(i, i + size));
  }
  return pages;
}

function escapeAndTruncate(str, max) {
  if (!str) return ''.padEnd(max);
  const safe = str.replace(/[_*~`]/g, '\\$&'); // Escape _ * ~ `
  return safe.length > max ? safe.slice(0, max - 1) + '…' : safe.padEnd(max);
}


function buildTerminalTableEmbed(location, terminals, page = 0, isPublic = false) {
  const chunks = chunkArray(terminals, PAGE_SIZE);
  const chunk = chunks[page] || [];

  const embed = new EmbedBuilder()
    .setTitle(`📍 Terminals in: ${location}`)
    .setColor(0x00bcd4)
    .setFooter({
      text: `Page ${page + 1} of ${chunks.length} • Total: ${terminals.length} terminals`
    })
    .setTimestamp();

    const header = '| Code   | Terminal Name        | Location           |';
    const divider = '|--------|----------------------|--------------------|';
    const rows = chunk.map(term => {
      const code = escapeAndTruncate(term.code || 'N/A', 6);
      const name = escapeAndTruncate(term.name || term.nickname || 'Unnamed Terminal', 20);
      const loc = escapeAndTruncate(
        term.space_station_name || term.orbit_name || term.planet_name || 'Unknown',
        18
      );
      
      return `| ${code} | ${name} | ${loc} |`;
    });
    embed.setDescription('```' + [header, divider, ...rows].join('\n') + '```');

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`uexterminals_page::${location}::${page - 1}::${isPublic}`)
      .setLabel('◀️ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`uexterminals_page::${location}::${page + 1}::${isPublic}`)
      .setLabel('▶️ Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === chunks.length - 1)
  );

  const components = [buttons];

  if (!isPublic) {
    components.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`uexterminals_make_public::${location}`)
        .setLabel('📢 Make Public')
        .setStyle(ButtonStyle.Primary)
    ));
  }

  return { embed, components, totalPages: chunks.length };
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
  help: "List all terminals (shops) in the system, planet or station name provided.",
  category: "Star Citizen",

    async execute(interaction) {

      if (!(await isUserVerified(interaction.user.id))) {
        return interaction.reply({
          content: '❌ You must verify your RSI profile using `/verify` before using this command.',
          flags: MessageFlags.Ephemeral
        });
      }
      
      const location = interaction.options.getString('location');
      const lowered = location.toLowerCase();
    
      const locationFilter = (field) =>
        where(fn('LOWER', col(field)), {
          [Op.like]: `%${lowered}%`
        });
    
      const matches = await db.UexTerminal.findAll({
        where: {
          [Op.or]: [
            locationFilter('star_system_name'),
            locationFilter('planet_name'),
            locationFilter('orbit_name'),
            locationFilter('space_station_name'),
            locationFilter('outpost_name'),
            locationFilter('city_name')
          ]
        },
        order: [['type', 'ASC'], ['name', 'ASC']],
        limit: 1000
      });
    
      if (!matches.length) {
        return interaction.reply({
          content: `❌ No terminals found matching "${location}".`,
          flags: MessageFlags.Ephemeral
        });
      }
    
      const { embed, components } = buildTerminalTableEmbed(location, matches, 0, false);
    
      return interaction.reply({
        embeds: [embed],
        components,
        flags: MessageFlags.Ephemeral
      });
    },   

  async button(interaction) {
    const [action, location, pageStr, isPublicRaw] = interaction.customId.split('::');
    const page = parseInt(pageStr, 10) || 0;
    const actionName = action.replace('uexterminals_', '');
    const isPublic = isPublicRaw === 'true' || actionName === 'make_public';   

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
      limit: 1000
    });
    

    if (!matches.length) {
      return interaction.reply({
        content: `❌ No terminals found at "${location}".`,
        flags: MessageFlags.Ephemeral
      });
    }
    
    const { embed, components } = buildTerminalTableEmbed(location, matches, page, isPublic);

    if (isPublic) {
      if (interaction.message.interaction) {
        await interaction.deferUpdate();

        // First message (from /uexterminals command)
        return interaction.channel.send({
          content: `📍 Terminals for **${location}**:`,
          embeds: [embed],
          components
        });
      } else {
        // We're paginating a public embed — just update it
        return interaction.update({
          embeds: [embed],
          components
        });
      }
    }
    
    
    return interaction.update({
      embeds: [embed],
      components,
      flags: MessageFlags.Ephemeral
    });
  }
};
