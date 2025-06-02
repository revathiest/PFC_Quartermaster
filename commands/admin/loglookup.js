const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { UsageLog, VoiceLog } = require('../../config/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loglookup')
    .setDescription('Query UsageLog entries by user or event type')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to filter by')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('event')
        .setDescription('Event type to filter by')
        .setRequired(false)
        .addChoices(
          { name: 'Command Used', value: 'command_used' },
          { name: 'Message Created', value: 'message_create' },
          { name: 'Message Edited', value: 'message_edit' },
          { name: 'Message Deleted', value: 'message_delete' },
          { name: 'Voice Join', value: 'voice_join' },
          { name: 'Voice Leave', value: 'voice_leave' },
        ))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  help: 'Searches recent usage logs with optional filters for user or event type. (Admin Only)',
  category: 'Admin',

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const userId = user ? user.id : null;
    const eventType = interaction.options.getString('event');

    const where = { server_id: interaction.guild.id };
    if (userId) where.user_id = userId;
    if (eventType) where.event_type = eventType;

    try {
      const queryOpts = {
        where,
        order: [['timestamp', 'DESC']],
        limit: 20,
      };

      const useVoiceLogs = eventType === 'voice_join' || eventType === 'voice_leave';
      const logs = useVoiceLogs ? await VoiceLog.findAll(queryOpts) : await UsageLog.findAll(queryOpts);

      if (!logs.length) {
        return interaction.reply({ content: 'No matching logs found.', flags: MessageFlags.Ephemeral });
      }

      const embed = new EmbedBuilder()
        .setTitle('Usage Log Results')
        .setColor(0x3498db)
        .setTimestamp();

      for (const log of logs) {
        const details = [];
        details.push(`User: <@${log.user_id}>`);
        if (log.channel_id) details.push(`Channel: <#${log.channel_id}>`);
        if (log.message_id) details.push(`Message ID: ${log.message_id}`);
        if (log.message_content) details.push(`Content: ${log.message_content.slice(0, 80)}`);
        if (log.duration) details.push(`Duration: ${Math.round(log.duration)}s`);

        embed.addFields({
          name: `${log.event_type} – ${new Date(log.timestamp).toLocaleString()}`,
          value: details.join('\n'),
        });
      }

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (error) {
      console.error('Error fetching usage logs:', error);
      await interaction.reply({ content: 'There was an error while retrieving the logs.', flags: MessageFlags.Ephemeral });
    }
  },
};
