const { SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('route')
    .setDescription('Dummy /trade route subcommand.'),
  async execute(interaction) {
    await interaction.reply({ content: '✅ Dummy response for /trade route.', ephemeral: true });
  }
};
