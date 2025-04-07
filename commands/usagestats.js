// commands/usagestats.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { UsageLog, VoiceLog, sequelize } = require('../config/database');
const { Op } = require('sequelize');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('usagestats')
    .setDescription('View 30-day usage stats for yourself or another user (admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to get stats for')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    // Permissions check for viewing others' stats
    if (target.id !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ You can only view your own stats unless you’re an admin.', ephemeral: true });
    }

    await interaction.deferReply();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // --- Text Usage ---
    const messageStats = await UsageLog.findAll({
      attributes: [
        'channel_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'message_count']
      ],
      where: {
        user_id: target.id,
        server_id: interaction.guild.id,
        event_type: 'message_create',
        timestamp: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      group: ['channel_id'],
      raw: true
    });

    // --- Voice Usage ---
    const voiceStats = await VoiceLog.findAll({
      attributes: [
        'channel_id',
        [sequelize.fn('SUM', sequelize.col('duration')), 'voice_duration']
      ],
      where: {
        user_id: target.id,
        server_id: interaction.guild.id,
        timestamp: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      group: ['channel_id'],
      raw: true
    });

    const voiceMap = Object.fromEntries(
      voiceStats.map(v => [v.channel_id, v.voice_duration])
    );

    // --- Merge stats ---
    const combinedChannelIds = new Set([
      ...messageStats.map(m => m.channel_id),
      ...voiceStats.map(v => v.channel_id)
    ]);

    const rows = [];
    for (const channelId of combinedChannelIds) {
      const messageCount = messageStats.find(m => m.channel_id === channelId)?.message_count || 0;
      const voiceTime = voiceMap[channelId] || 0;
      rows.push({
        channelId,
        messageCount,
        voiceTime
      });
    }

    // --- Embed Formatting ---
    const embed = {
      color: 0x0099ff,
      title: `📊 30-Day Usage Stats for ${target.username}`,
      fields: [],
      timestamp: new Date().toISOString()
    };

    const column1 = ['**Channel**'];
    const column2 = ['**Messages**'];
    const column3 = ['**Voice (min)**'];

    for (const row of rows) {
      column1.push(`<#${row.channelId}>`);
      column2.push(`${row.messageCount}`);
      column3.push(`${Math.round(row.voiceTime / 60)}`);
    }

    embed.fields.push(
      { name: '\u200B', value: column1.join('\n'), inline: true },
      { name: '\u200B', value: column2.join('\n'), inline: true },
      { name: '\u200B', value: column3.join('\n'), inline: true }
    );

    await interaction.editReply({ embeds: [embed] });
  }
};
