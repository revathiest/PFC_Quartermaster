const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { UsageLog } = require('../../config/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loglookup')
    .setDescription('Query UsageLog entries by user, event, or message ID')
    .addStringOption(opt =>
      opt.setName('user')
        .setDescription('Discord user ID to filter by')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('event')
        .setDescription('Event type to filter by')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('message-id')
        .setDescription('Specific message ID to look up')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  help: 'Searches recent usage logs with optional filters for user, event type, or message ID. (Admin Only)',
  category: 'Admin',

  async execute(interaction) {
    const userId = interaction.options.getString('user');
    const eventType = interaction.options.getString('event');
    const messageId = interaction.options.getString('message-id');

    const where = { server_id: interaction.guild.id };
    if (userId) where.user_id = userId;
    if (eventType) where.event_type = eventType;
    if (messageId) where.message_id = messageId;

    try {
      const logs = await UsageLog.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: 20,
      });

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
