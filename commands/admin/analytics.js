const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { generateUsageReport, generateVoiceActivityReport, generateReportByChannel } = require('../../utils/generateAnalytics');

const allowedRoles = ['Admiral', 'Fleet Admiral'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('analytics')
    .setDescription('Generate analytics reports')
    .addSubcommand(sub =>
      sub.setName('usage')
        .setDescription('Generate a usage report')
    )
    .addSubcommand(sub =>
      sub.setName('voice')
        .setDescription('Generate a voice activity report')
    )
    .addSubcommand(sub =>
      sub.setName('channel')
        .setDescription('Generate a report for a specific channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel to report on')
            .setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  help: 'Generates usage, voice, or channel-specific analytics reports. (Admin Only)',
  category: 'Discord',

  async execute(interaction, client) {
    const memberRoles = interaction.member.roles.cache.map(role => role.name);

    if (!allowedRoles.some(role => memberRoles.includes(role))) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    const serverId = interaction.guild.id;
    const channelOption = interaction.options.getChannel('channel');

    await interaction.deferReply({ ephemeral: true });

    let report;
    let title = `Report for ${sub.charAt(0).toUpperCase() + sub.slice(1)}`;
    let description;

    try {
      switch (sub) {
        case 'usage':
          report = await generateUsageReport(serverId);
          description = "This report shows the number of events logged in each channel over the past 7 days.";
          break;
        case 'voice':
          report = await generateVoiceActivityReport(serverId);
          description = "This report shows the voice activity in each channel over the past 7 days, including the average number of users, peak number of users, and the total time logged.";
          break;
        case 'channel':
          if (!channelOption) {
            return interaction.editReply({ content: 'You need to specify a channel for the channel report.', ephemeral: true });
          }
          const channelId = channelOption.id;
          report = await generateReportByChannel(serverId, channelId);
          description = `This report breaks down each type of event that has happened in the channel ${channelOption.name} over the past 7 days.`;
          break;
        default:
          return interaction.editReply({ content: 'Invalid report type.', ephemeral: true });
      }

      if (report.length === 0) {
        return interaction.editReply({ content: `No data found for ${sub} report.`, ephemeral: true });
      }

      const chunks = chunkArray(report, 10);

      for (const [index, chunk] of chunks.entries()) {
        const embed = {
          title: `${title} (Page ${index + 1}/${chunks.length})`,
          description,
          color: 0x0099ff,
          timestamp: new Date().toISOString(),
          fields: []
        };

        switch (sub) {
          case 'usage':
            embed.fields.push(
              { name: 'Channel', value: chunk.map(row => `<#${row.channel_id}>`).join('\n'), inline: true },
              { name: 'Event Count', value: chunk.map(row => `${row.event_count}`).join('\n'), inline: true }
            );
            break;
          case 'channel':
            embed.fields.push(
              { name: 'Event Type', value: chunk.map(row => row.event_type).join('\n'), inline: true },
              { name: 'Event Count', value: chunk.map(row => `${row.event_count}`).join('\n'), inline: true }
            );
            break;
          case 'voice':
            embed.fields.push(
              { name: 'Channel', value: chunk.map(row => `<#${row.channel_id}>`).join('\n'), inline: true },
              { name: 'Users', value: chunk.map(row => `Avg: ${row.average_users}, Peak: ${row.peak_users}`).join('\n'), inline: true },
              { name: 'Total Time', value: chunk.map(row => `${row.total_duration}`).join('\n'), inline: true }
            );
            break;
        }

        if (index === 0) {
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
          await interaction.followUp({ embeds: [embed], ephemeral: true });
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      await interaction.editReply({ content: 'There was an error while generating the report. Please try again later.', ephemeral: true });
    }
  }
};

function chunkArray(array, size) {
  const chunkedArray = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArray.push(array.slice(i, i + size));
  }
  return chunkedArray;
}
