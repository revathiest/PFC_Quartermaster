const { SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('find')
    .setDescription('Dummy /trade find subcommand.'),
  async execute(interaction) {
    await interaction.reply({ content: '✅ Dummy response for /trade find.', ephemeral: true });
  }
};
