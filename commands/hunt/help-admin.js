const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('help-admin')
    .setDescription('Moderation and configuration guide'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🛠️ Scavenger Hunt Admin Guide')
      .setColor(0xff8800)
      .setDescription([
        'These commands are reserved for moderators and fleet staff.',
        '',
        'Manage the hunt and keep things running smoothly:'
      ].join('\n'))
      .addFields(
        { name: '🛡️ /hunt set-channels', value: 'Configure activity and review channels.' },
        { name: '✨ /hunt poi create', value: 'Add a new Point of Interest to the global list.' },
        { name: '📝 /hunt poi list', value: 'Edit or archive existing POIs and review submissions.' }
      )
      .setFooter({ text: 'Only users with the Admiral roles can run these commands.' });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
