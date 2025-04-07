// commands/usagestats.js
const { SlashCommandBuilder, EmbedBuilder, userMention } = require('discord.js');
const { Op } = require('sequelize');
const { UsageLog, VoiceLog } = require('../config/database');
const { isAdmin } = require('../botactions/userManagement/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('usagestats')
    .setDescription('View message and voice usage stats for yourself or another user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Select a user to view stats for')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const isAllowed = await isAdmin(interaction.member);
    const requestingUser = interaction.user;

    if (targetUser.id !== requestingUser.id && !isAllowed) {
      return interaction.reply({
        content: '❌ You don’t have permission to view stats for other users.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const serverId = interaction.guild.id;

    // Message Stats
    const messageStats = await UsageLog.findAll({
      where: {
        user_id: targetUser.id,
        server_id: serverId,
        event_type: 'message_create',
        timestamp: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: ['channel_id'],
      raw: true
    });

    const messageCounts = {};
    for (const msg of messageStats) {
      const channelId = msg.channel_id;
      messageCounts[channelId] = (messageCounts[channelId] || 0) + 1;
    }

    const messageFields = [
      { name: '**Channel**', value: '\u200B', inline: true },
      { name: '**Messages**', value: '\u200B', inline: true },
      { name: '\u200B', value: '\u200B', inline: true }
    ];

    for (const [channelId, count] of Object.entries(messageCounts)) {
      messageFields[0].value += `<#${channelId}>\n`;
      messageFields[1].value += `${count}\n`;
      messageFields[2].value += '\u200B\n';
    }

    // Voice Stats
    const voiceStats = await VoiceLog.findAll({
      where: {
        user_id: targetUser.id,
        server_id: serverId,
        timestamp: { [Op.gte]: thirtyDaysAgo },
        duration: { [Op.gt]: 0 }
      },
      raw: true
    });

    const voiceData = {};
    for (const log of voiceStats) {
      const chan = log.channel_id || 'Unknown';
      if (!voiceData[chan]) {
        voiceData[chan] = { total: 0, count: 0 };
      }
      voiceData[chan].total += log.duration || 0;
      voiceData[chan].count++;
    }

    const voiceFields = [
      { name: '**Voice Channel**', value: '\u200B', inline: true },
      { name: '**Total (min)**', value: '\u200B', inline: true },
      { name: '**Avg (min)**', value: '\u200B', inline: true }
    ];

    for (const [chan, { total, count }] of Object.entries(voiceData)) {
      voiceFields[0].value += `<#${chan}>\n`;
      voiceFields[1].value += `${Math.round(total / 60)}\n`;
      voiceFields[2].value += `${Math.round(total / count / 60)}\n`;
    }

    // Command Usage Stats
    const commandStats = await UsageLog.findAll({
      where: {
        user_id: targetUser.id,
        server_id: serverId,
        event_type: 'command_used',
        timestamp: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: ['command_name'],
      raw: true
    });

    const commandCounts = {};
    for (const log of commandStats) {
      const cmd = log.command_name || 'Unknown';
      commandCounts[cmd] = (commandCounts[cmd] || 0) + 1;
    }

    const commandFields = [
      { name: '**Command**', value: '\u200B', inline: true },
      { name: '**Used**', value: '\u200B', inline: true },
      { name: '\u200B', value: '\u200B', inline: true }
    ];

    for (const [cmd, count] of Object.entries(commandCounts)) {
      commandFields[0].value += `/${cmd}\n`;
      commandFields[1].value += `${count}\n`;
      commandFields[2].value += '\u200B\n';
    }

    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle(`📊 Usage Summary for ${userMention(targetUser.id)}`)
      .setDescription(`Stats from the last 30 days`)
      .addFields(
        { name: '📝 Messages', value: '\u200B' },
        ...messageFields,
        { name: '\u200B', value: '\u200B' },
        { name: '🎙️ Voice', value: '\u200B' },
        ...voiceFields,
        { name: '\u200B', value: '\u200B' },
        { name: '⌨️ Commands', value: '\u200B' },
        ...commandFields
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
