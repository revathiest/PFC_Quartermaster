// commands/usagestats.js
const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags
  } = require('discord.js');
  const { UsageLog, VoiceLog } = require('../../config/database');
  const { Op } = require('sequelize');
  const { isAdmin } = require('../../botactions/userManagement/permissions');
  const { isUserVerified } = require('../../utils/verifyGuard');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('usagestats')
      .setDescription('Show usage stats for yourself or another user.')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to show stats for (admin only)')
          .setRequired(false)
      ),
    help: 'Shows a summary of a user’s message, command, and voice usage across the server (past 30 days). Admins can query others.',
    category: 'Discord',      
  
    async execute(interaction) {

      if (!(await isUserVerified(interaction.user.id))) {
        return interaction.reply({
          content: '❌ You must verify your RSI profile using `/verify` before using this command.',
          flags: MessageFlags.Ephemeral
        });
      }
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const isUserAdmin = await isAdmin(interaction.member);
      const serverId = interaction.guildId;
  
      // Block non-admins from querying others
      if (targetUser.id !== interaction.user.id && !isUserAdmin) {
        return interaction.reply({
          content: '❌ Only admins can view stats for other users.',
          flags: MessageFlags.Ephemeral,
        });
      }
  
      await interaction.deferReply({flags: MessageFlags.Ephemeral});
  
      const now = new Date();
      const daysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  
      // === Messages
      const usageLogs = await UsageLog.findAll({
        where: {
          user_id: targetUser.id,
          server_id: serverId,
          event_time: { [Op.gte]: daysAgo }
        }
      });
  
      const messageCounts = {};
      const commandCounts = {};
  
      for (const log of usageLogs) {
        if (log.interaction_type === 'message' && log.channel_id) {
          messageCounts[log.channel_id] = (messageCounts[log.channel_id] || 0) + 1;
        }
        if (log.interaction_type === 'command' && log.command_name) {
          commandCounts[log.command_name] = (commandCounts[log.command_name] || 0) + 1;
        }
      }
  
      // === Voice
      const voiceLogs = await VoiceLog.findAll({
        where: {
          user_id: targetUser.id,
          server_id: serverId,
          timestamp: { [Op.gte]: daysAgo }
        }
      });
  
      const voiceData = {};
      for (const log of voiceLogs) {
        const id = log.channel_id || 'unknown';
        if (!voiceData[id]) {
          voiceData[id] = { total: 0, count: 0 };
        }
        voiceData[id].total += log.duration || 0;
        voiceData[id].count++;
      }

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    const displayName = member?.displayName || targetUser.username;

    // === Embed Construction
    const embed = new EmbedBuilder()
    .setColor(0x00AE86)
    .setTitle(`📊 Usage Summary for ${displayName}`)
    .setDescription(`A summary of user activity across the server, including messages sent, time spent in voice channels, and commands used.`)
    .setFooter({ text: `Stats from the last 30 days.` })
    .setTimestamp();

    // ==== MESSAGES SECTION ====
    embed.addFields({ name: '📝 Messages', value: ' ' }); // thin space to render the section nicely
    if (Object.keys(messageCounts).length === 0) {
    embed.addFields({ name: 'No text activity', value: 'No messages sent during the last 30 days.', inline: false });
    } else {
    embed.addFields(
        { name: '**Channel**', value: Object.keys(messageCounts).map(id => `<#${id}>`).join('\n'), inline: true },
        { name: '**Messages**', value: Object.values(messageCounts).join('\n'), inline: true }
    );
    }

    // ==== VOICE SECTION ====
    embed.addFields({ name: '🎙️ Voice', value: ' ' });
    if (Object.keys(voiceData).length === 0) {
    embed.addFields({ name: 'No voice activity', value: 'No voice time recorded during the last 30 days.', inline: false });
    } else {
    embed.addFields(
        { name: '**Channel**', value: Object.keys(voiceData).map(id => `<#${id}>`).join('\n'), inline: true },
        { name: '**Total (min)**', value: Object.values(voiceData).map(v => `${Math.round(v.total / 60)}`).join('\n'), inline: true },
        { name: '**Avg (min)**', value: Object.values(voiceData).map(v => `${Math.round((v.total / v.count) / 60)}`).join('\n'), inline: true }
    );
    }

    // ==== COMMANDS SECTION ====
    embed.addFields({ name: '⌨️ Commands', value: ' ' });
    if (Object.keys(commandCounts).length === 0) {
    embed.addFields({ name: 'No commands used', value: 'No commands were used during the last 30 days.', inline: false });
    } else {
    embed.addFields(
        { name: '**Command**', value: Object.keys(commandCounts).map(cmd => `/${cmd}`).join('\n'), inline: true },
        { name: '**Used**', value: Object.values(commandCounts).join('\n'), inline: true }
    );
    }

  
      await interaction.editReply({ embeds: [embed]});
    }
  };
  