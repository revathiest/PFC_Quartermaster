const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { Hunt, HuntSubmission, HuntPoi } = require('../../config/database');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('my-submissions')
    .setDescription('View your submissions for the current hunt'),

  async execute(interaction) {
    const userId = interaction.user.id;
    try {
      const hunt = await Hunt.findOne({ where: { status: 'active' } });
      if (!hunt) {
        return interaction.reply({ content: '❌ No active hunt.', flags: MessageFlags.Ephemeral });
      }

      const submissions = await HuntSubmission.findAll({
        where: { hunt_id: hunt.id, user_id: userId },
        order: [['submitted_at', 'ASC']]
      });

      if (!submissions.length) {
        return interaction.reply({ content: '❌ You have no submissions for this hunt.', flags: MessageFlags.Ephemeral });
      }

      const poiIds = [...new Set(submissions.map(s => s.poi_id))];
      const pois = await HuntPoi.findAll({ where: { id: poiIds } });
      const poiMap = new Map(pois.map(p => [p.id, p]));

      let total = 0;
      const embed = new EmbedBuilder().setTitle('Your Hunt Submissions');

      for (const sub of submissions) {
        const poi = poiMap.get(sub.poi_id) || { name: 'Unknown', points: 0 };
        if (sub.status === 'approved') total += poi.points;
        const pointsText = sub.status === 'approved' ? ` (+${poi.points} pts)` : '';
        embed.addFields({ name: `${poi.name} <${sub.status}>${pointsText}`, value: '\u200b' });
      }

      embed.setDescription(`Total points earned: ${total}`);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to fetch submissions:', err);
      await interaction.reply({ content: '❌ Failed to fetch submissions.', flags: MessageFlags.Ephemeral });
    }
  }
};
