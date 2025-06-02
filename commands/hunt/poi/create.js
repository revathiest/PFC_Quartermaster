const { SlashCommandSubcommandBuilder, MessageFlags } = require('discord.js');
const { HuntPoi } = require('../../../config/database');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('create')
    .setDescription('Create a point of interest')
    .addStringOption(opt => opt.setName('name').setDescription('POI name').setRequired(true))
    .addStringOption(opt => opt.setName('hint').setDescription('Hint for hunters').setRequired(true))
    .addStringOption(opt => opt.setName('location').setDescription('Location').setRequired(true))
    .addIntegerOption(opt => opt.setName('points').setDescription('Point value').setRequired(true))
    .addStringOption(opt => opt.setName('image').setDescription('Image URL').setRequired(false)),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const hint = interaction.options.getString('hint');
    const location = interaction.options.getString('location');
    const image = interaction.options.getString('image');
    const points = interaction.options.getInteger('points');
    const userId = interaction.user.id;

    try {
      await HuntPoi.create({
        name,
        hint,
        location,
        image_url: image || null,
        points,
        status: 'active',
        created_by: userId
      });

      await interaction.reply({ content: `✅ POI "${name}" created.`, flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to create POI:', err);
      await interaction.reply({ content: '❌ Failed to create POI.', flags: MessageFlags.Ephemeral });
    }
  }
};
