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

      const allSubmissions = await HuntSubmission.findAll({
        where: { hunt_id: hunt.id, user_id: userId },
        order: [['submitted_at', 'ASC']]
      });

      const supersededIds = new Set(allSubmissions.map(s => s.supersedes_submission_id).filter(Boolean));
      const submissions = allSubmissions.filter(s => !supersededIds.has(s.id));

      if (!submissions.length) {
        return interaction.reply({ content: '❌ You have no submissions for this hunt.', flags: MessageFlags.Ephemeral });
      }

      const poiIds = [...new Set(submissions.map(s => s.poi_id))];
      const pois = await HuntPoi.findAll({ where: { id: poiIds } });
      const poiMap = new Map(pois.map(p => [p.id, p]));

      let total = 0;
      const pending = [];
      const approved = [];
      const rejected = [];

      for (const sub of submissions) {
        const poi = poiMap.get(sub.poi_id) || { name: 'Unknown', points: 0 };
        if (sub.status === 'approved') {
          total += poi.points;
          approved.push(`${poi.name} (+${poi.points} pts)`);
        } else if (sub.status === 'pending') {
          pending.push(poi.name);
        } else if (sub.status === 'rejected') {
          rejected.push(poi.name);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('Your Hunt Submissions')
        .setDescription(`Total points earned: ${total}`);

      if (pending.length) embed.addFields({ name: 'Pending', value: pending.join('\n') });
      if (approved.length) embed.addFields({ name: 'Approved', value: approved.join('\n') });
      if (rejected.length) embed.addFields({ name: 'Rejected', value: rejected.join('\n') });

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to fetch submissions:', err);
      await interaction.reply({ content: '❌ Failed to fetch submissions.', flags: MessageFlags.Ephemeral });
    }
  }
};
