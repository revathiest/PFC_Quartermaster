const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('help')
    .setDescription('Learn how the scavenger hunt works'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🧭 How Scavenger Hunts Work')
      .setDescription(
        'Snap a selfie with each Point of Interest (POI) during an active hunt and submit it via `/hunt poi list`.\n' +
        'Approved submissions grant points — accumulate the most before the hunt ends to win.'
      )
      .addFields(
        { name: '/hunt list', value: 'View current and upcoming hunts.' },
        { name: '/hunt poi list', value: 'Browse POIs and submit your selfies.' },
        { name: '/hunt score [user]', value: 'Check your own or another player\'s progress.' },
        { name: '/hunt leaderboard', value: 'See who\'s leading the hunt.' },
        { name: '/hunt help', value: 'Show this help message again.' }
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
