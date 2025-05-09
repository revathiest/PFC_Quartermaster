const { SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('price')
    .setDescription('Dummy /trade price subcommand.'),
  async execute(interaction) {
    await interaction.reply({ content: '✅ Dummy response for /trade price.', ephemeral: true });
  }
};
