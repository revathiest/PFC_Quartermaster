const { SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('commodities')
    .setDescription('Dummy /trade commodities subcommand.'),
  async execute(interaction) {
    await interaction.reply({ content: '✅ Dummy response for /trade commodities.', ephemeral: true });
  }
};
