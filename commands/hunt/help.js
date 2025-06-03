const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('help')
    .setDescription('Learn how the scavenger hunt works'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Scavenger Hunt Commands')
      .setDescription('Submit selfies at points of interest to earn points. Use the commands below to participate or manage hunts.')
      .addFields(
        { name: '/hunt help', value: 'Show this help message.' },
        { name: '/hunt list', value: 'List all hunts and their current status.' },
        { name: '/hunt schedule', value: 'Create a new hunt and Discord event (admin).' },
        { name: '/hunt set-channels', value: 'Configure activity and review channels (admin).' },
        { name: '/hunt poi create', value: 'Create a new Point of Interest (admin).' },
        { name: '/hunt poi list', value: 'Browse POIs, submit proof, or edit/archive (admin).' }
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
