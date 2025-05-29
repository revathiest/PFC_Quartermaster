const { SlashCommandBuilder } = require('discord.js');
const audioManager = require('../..//services/audioManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or playlist')
    .addStringOption(opt =>
      opt.setName('query')
        .setDescription('Spotify URL, YouTube URL or search query')
        .setRequired(true)
    ),
  help: 'Play music using Lavalink',
  category: 'Music',
  async execute(interaction) {
    const query = interaction.options.getString('query');
    await interaction.deferReply({});
    const channelId = interaction.member.voice?.channelId;
    if (!channelId) {
      return interaction.editReply('❌ You must join a voice channel first.');
    }
    try {
      audioManager.join(interaction.guild.id, channelId, interaction.guild.voiceAdapterCreator);
      await audioManager.enqueue(interaction.guild.id, query);
      await interaction.editReply({ content: `Queued: ${query}` });
    } catch (err) {
      await interaction.editReply(`❌ Failed to play track: ${err.message}`);
    }
  }
};
