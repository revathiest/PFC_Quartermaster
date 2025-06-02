const { SlashCommandSubcommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const { Config } = require('../../config/database');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('set-channels')
    .setDescription('Configure hunt activity and review channels')
    .addChannelOption(opt =>
      opt.setName('activity')
        .setDescription('Channel where /hunt commands are allowed')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addChannelOption(opt =>
      opt.setName('review')
        .setDescription('Channel where submissions are reviewed')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)),

  async execute(interaction) {
    const activity = interaction.options.getChannel('activity');
    const review = interaction.options.getChannel('review');
    const botType = process.env.BOT_TYPE || 'development';

    try {
      await Config.upsert({ key: 'hunt_activity_channel', value: activity.id, botType });
      await Config.upsert({ key: 'hunt_review_channel', value: review.id, botType });

      await interaction.reply({
        content: `✅ Hunt channels updated:\n• Activity: <#${activity.id}>\n• Review: <#${review.id}>`,
        flags: MessageFlags.Ephemeral
      });
    } catch (err) {
      console.error('❌ Failed to update hunt channels:', err);
      await interaction.reply({ content: '❌ Failed to update channels.', flags: MessageFlags.Ephemeral });
    }
  }
};
