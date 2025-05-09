const { SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('circuit')
    .setDescription('Dummy /trade circuit subcommand.'),
  async execute(interaction) {
    await interaction.reply({ content: '✅ Dummy response for /trade circuit.', ephemeral: true });
  }
};
