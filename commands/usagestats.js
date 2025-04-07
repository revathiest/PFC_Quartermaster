// commands/usagestats.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { UsageLog, VoiceLog } = require('../config/database');
const { isAdmin } = require('../botactions/userManagement/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('usagestats')
    .setDescription('Displays usage stats per channel')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get stats for (admin only)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const isTargetingAnotherUser = targetUser.id !== interaction.user.id;

    // Only allow other-user lookup if admin
    if (isTargetingAnotherUser && !(await isAdmin(interaction.member))) {
      return interaction.reply({
        content: '❌ You do not have permission to view other users’ stats.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const serverId = interaction.guildId;

    // Message stats per channel
    const messageLogs = await UsageLog.findAll({
      attributes: ['channel_id'],
      where: {
        user_id: targetUser.id,
        server_id: serverId
      }
    });

    const messageCounts = {};
    for (const log of messageLogs) {
      const channelId = log.channel_id || 'unknown';
      messageCounts[channelId] = (messageCounts[channelId] || 0) + 1;
    }

    // Voice stats per channel
    const voiceLogs = await VoiceLog.findAll({
      attributes: ['channel_id', 'duration'],
      where: {
        user_id: targetUser.id,
        server_id: serverId
      }
    });

    const voiceDurations = {};
    for (const log of voiceLogs) {
      const channelId = log.channel_id || 'unknown';
      voiceDurations[channelId] = (voiceDurations[channelId] || 0) + (log.duration || 0);
    }

    // Combine results
    const allChannelIds = new Set([
      ...Object.keys(messageCounts),
      ...Object.keys(voiceDurations)
    ]);

    const lines = [];

    for (const channelId of allChannelIds) {
      const messageCount = messageCounts[channelId] || 0;
      const voiceTimeMin = Math.round((voiceDurations[channelId] || 0) / 60);

      const channelMention = channelId !== 'unknown'
        ? `<#${channelId}>`
        : 'Unknown';

      lines.push(`${channelMention} | 💬 ${messageCount} messages | 🎙️ ${voiceTimeMin} min`);
    }

    const embed = {
      color: 0x6699ff,
      title: `Usage Stats for ${targetUser.username}`,
      description: lines.length ? lines.join('\n') : 'No usage data found.',
      timestamp: new Date().toISOString()
    };

    await interaction.editReply({ embeds: [embed] });
  }
};
