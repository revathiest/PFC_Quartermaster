const { SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('locations')
    .setDescription('Dummy /trade locations subcommand.'),
  async execute(interaction) {
    await interaction.reply({ content: '✅ Dummy response for /trade locations.', ephemeral: true });
  }
};
