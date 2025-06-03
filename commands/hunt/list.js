const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { Hunt } = require('../../config/database');
const { getHuntStatus } = require('../../utils/hunt');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('List all scavenger hunts'),

  async execute(interaction) {
    try {
      const hunts = await Hunt.findAll({ order: [['starts_at', 'DESC']] });
      if (!hunts.length) {
        return interaction.reply({ content: '❌ No scavenger hunts found.', flags: MessageFlags.Ephemeral });
      }

      const embed = new EmbedBuilder()
      .setTitle('🧭 Scavenger Hunts')
      .setColor(0xffcc00)
      .setDescription('Here are the current and upcoming scavenger hunts.');
    
    // Group hunts by status
    const groups = {
      active: [],
      upcoming: [],
      archived: [],
      unknown: [],
    };
    
    for (const h of hunts) {
      const status = getHuntStatus(h)?.toLowerCase();
      if (groups[status]) {
        groups[status].push(h);
      } else {
        groups.unknown.push(h);
      }
    }
    
    // Format a hunt for display
    function formatHunt(h) {
      const start = h.starts_at ? new Date(h.starts_at).toLocaleString() : 'N/A';
      const end = h.ends_at ? new Date(h.ends_at).toLocaleString() : 'N/A';
      return `**${h.name}**\nStart: ${start}\nEnd: ${end}`;
    }
    
    // Add sections — no extra padding, just clean groups
    if (groups.active.length) {
      embed.addFields({
        name: '🟢 Active Hunts',
        value: groups.active.map(formatHunt).join('\n\n'),
      });
    }
    
    if (groups.upcoming.length) {
      embed.addFields({
        name: '🕒 Upcoming Hunts',
        value: groups.upcoming.map(formatHunt).join('\n\n'),
      });
    }
    
    if (groups.archived.length) {
      embed.addFields({
        name: '🔴 Archived Hunts',
        value: groups.archived.map(formatHunt).join('\n\n'),
      });
    }
    
    if (groups.unknown.length) {
      embed.addFields({
        name: '❓ Unknown Status',
        value: groups.unknown.map(formatHunt).join('\n\n'),
      });
    }
    
    embed.setFooter({ text: 'Status is based on current UTC time.' });        
    
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to fetch hunts:', err);
      await interaction.reply({ content: '❌ Error fetching hunts.', flags: MessageFlags.Ephemeral });
    }
  }
};
