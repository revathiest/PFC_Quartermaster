// commands/usagestats.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { UsageLog, VoiceLog } = require('../config/database');
const { isAdmin } = require('../botactions/userManagement/permissions');
const { Op } = require('sequelize');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('usagestats')
    .setDescription('Shows a user\'s message and voice usage stats over the last 30 days.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to view stats for (admin only)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const requestingUser = interaction.user;

    // Permissions check if viewing another user's data
    if (targetUser.id !== requestingUser.id && !(await isAdmin(interaction.member))) {
      return interaction.editReply({ content: '❌ Only admins can view other users’ stats.', ephemeral: true });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch messages grouped by channel
    const messages = await UsageLog.findAll({
      where: {
        user_id: targetUser.id,
        event_type: 'message_create',
        timestamp: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: ['channel_id'],
      raw: true
    });

    // Count messages per channel
    const messageCounts = {};
    for (const msg of messages) {
      const id = msg.channel_id || 'Unknown';
      messageCounts[id] = (messageCounts[id] || 0) + 1;
    }

    // Fetch voice durations grouped by channel
    const voiceLogs = await VoiceLog.findAll({
      where: {
        user_id: targetUser.id,
        timestamp: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: ['channel_id', 'duration'],
      raw: true
    });

    // Sum durations per channel
    const voiceDurations = {};
    for (const log of voiceLogs) {
      const id = log.channel_id || 'Unknown';
      voiceDurations[id] = (voiceDurations[id] || 0) + (log.duration || 0);
    }

    // Combine all channel IDs
    const allChannelIds = new Set([...Object.keys(messageCounts), ...Object.keys(voiceDurations)]);

    // Format fields in chunks of three columns
    const fields = [];
    for (const channelId of allChannelIds) {
      const name = `<#${channelId}>` || 'Unknown';
      const messages = messageCounts[channelId] || 0;
      const voiceMins = Math.floor((voiceDurations[channelId] || 0) / 60);

      fields.push(
        { name: 'Channel', value: name, inline: true },
        { name: 'Messages', value: `${messages}`, inline: true },
        { name: 'Voice (mins)', value: `${voiceMins}`, inline: true }
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0x3399ff)
      .setTitle(`📊 30-Day Usage for ${targetUser.username}`)
      .addFields(fields)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
