const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('help')
    .setDescription('Learn how the scavenger hunt works'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🧭 Scavenger Hunt Guide')
      .setColor(0x00aaff)
      .setDescription([
        'Welcome to the **Scavenger Hunt**, pilot!',
        '',
        'Your mission:',
        '• Visit Points of Interest (POIs) during an active hunt',
        '• Snap a selfie and submit it using `/hunt poi list`',
        '• Rack up points and rise to the top before the hunt ends',
        '',
        '_Submissions are only accepted while a hunt is active._'
      ].join('\n'))
      .addFields(
        { name: '📜 /hunt list', value: 'View current and upcoming hunts.' },
        { name: '📸 /hunt poi list', value: 'Browse POIs and submit your selfies.' },
        { name: '📊 /hunt score [user]', value: 'Check your score or snoop on someone else.' },
        { name: '🏆 /hunt leaderboard', value: 'See who’s currently in the lead.' },
        { name: '❔ /hunt help', value: 'This guide right here.' }
      )
      .setFooter({ text: 'Only the bold earn glory. Stay sharp out there.' });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
