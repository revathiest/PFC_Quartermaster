// commands/usagestats.js
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    userMention,
  } = require('discord.js');
  const { Op } = require('sequelize');
  const { UsageLog, VoiceLog } = require('../config/database');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('usagestats')
      .setDescription('Show message and voice activity for a user (last 30 days)')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to view stats for (admin only)')
          .setRequired(false)
      ),
  
    async execute(interaction) {
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      const targetUser = interaction.options.getUser('user') || interaction.user;
  
      if (!isAdmin && targetUser.id !== interaction.user.id) {
        return interaction.reply({
          content: '❌ You can only view your own stats unless you\'re an admin.',
          ephemeral: true
        });
      }
  
      await interaction.deferReply();
  
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
  
      const [usageLogs, voiceLogs] = await Promise.all([
        UsageLog.findAll({
          where: {
            user_id: targetUser.id,
            timestamp: {
              [Op.gte]: thirtyDaysAgo
            }
          }
        }),
        VoiceLog.findAll({
          where: {
            user_id: targetUser.id,
            timestamp: {
              [Op.gte]: thirtyDaysAgo
            }
          }
        })
      ]);
  
      const messageCounts = {};
      const voiceDurations = {};
  
      for (const log of usageLogs) {
        const channel = log.channel_id || 'Unknown';
        messageCounts[channel] = (messageCounts[channel] || 0) + 1;
      }
  
      for (const log of voiceLogs) {
        const channel = log.channel_id || 'Unknown';
        voiceDurations[channel] = (voiceDurations[channel] || 0) + (log.duration || 0);
      }
  
      const messageStats = Object.entries(messageCounts)
        .map(([channel, count]) => `<#${channel}>: ${count} messages`)
        .join('\n') || 'No messages';
  
      const voiceStats = Object.entries(voiceDurations)
        .map(([channel, seconds]) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `<#${channel}>: ${mins}m ${secs}s in voice`;
        })
        .join('\n') || 'No voice activity';
  
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`📊 30-Day Usage Stats for ${targetUser.username}`)
        .setDescription(`Showing activity from <t:${Math.floor(thirtyDaysAgo.getTime() / 1000)}:R> to now.`)
        .addFields(
          { name: '📝 Messages', value: messageStats, inline: false },
          { name: '🎙️ Voice', value: voiceStats, inline: false }
        )
        .setFooter({ text: 'Tracked usage in the last 30 days' })
        .setTimestamp();
  
      await interaction.editReply({ embeds: [embed] });
    }
  };
  