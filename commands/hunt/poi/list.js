const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { HuntPoi } = require('../../../config/database');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('List available POIs'),

  async execute(interaction) {
    try {
      const pois = await HuntPoi.findAll({ where: { status: 'active' }, order: [['name', 'ASC']] });
      if (!pois.length) {
        return interaction.reply({ content: '❌ No POIs found.', flags: MessageFlags.Ephemeral });
      }

      const embed = new EmbedBuilder().setTitle('Points of Interest');
      for (const poi of pois) {
        embed.addFields({ name: `${poi.name} (${poi.points} pts)`, value: poi.hint });
      }

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to list POIs:', err);
      await interaction.reply({ content: '❌ Error fetching POIs.', flags: MessageFlags.Ephemeral });
    }
  }
};
