const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const audioManager = require('../..//services/audioManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show current music queue'),
  help: 'Display queued tracks',
  category: 'Music',
  async execute(interaction) {
    const queue = audioManager.getQueue(interaction.guild.id);
    if (!queue.length) {
      return interaction.reply({ content: 'Queue is empty.' });
    }
    const description = queue.map((t, i) => `${i + 1}. ${t.info?.title || 'Unknown'}`).join('\n');
    const embed = new EmbedBuilder().setTitle('Music Queue').setDescription(description);
    return interaction.reply({ embeds: [embed] });
  }
};
