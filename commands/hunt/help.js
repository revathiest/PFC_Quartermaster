const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('help')
    .setDescription('Learn how the scavenger hunt works'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Scavenger Hunt')
      .setDescription('Submit selfies at points of interest to earn points.');

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
