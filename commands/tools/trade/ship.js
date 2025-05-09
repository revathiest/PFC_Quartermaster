const { SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('ship')
    .setDescription('Dummy /trade ship subcommand.'),
  async execute(interaction) {
    await interaction.reply({ content: '✅ Dummy response for /trade ship.', ephemeral: true });
  }
};
