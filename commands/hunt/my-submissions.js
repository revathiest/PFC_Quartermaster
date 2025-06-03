const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { Op } = require('sequelize');
const { Hunt, HuntSubmission, HuntPoi } = require('../../config/database');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('my-submissions')
    .setDescription('View your submissions for the current hunt'),

  async execute(interaction) {
    const userId = interaction.user.id;
    try {
      const hunt = await Hunt.findOne({
        where: {
          starts_at: { [Op.lte]: new Date() },
          ends_at: { [Op.gte]: new Date() }
        }
      });
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
        .setTitle('🎯 Your Hunt Submissions')
        .setDescription(`**Total Points Earned:** 🏆 ${total}`)
        .setColor('Gold')
        .setTimestamp()
        .setFooter({ text: 'Keep hunting, Commander.' });

      const formatList = (list, withPoints = false) =>
        list
          .map(entry => {
            if (withPoints) {
              const match = entry.match(/(.+?) \(\+(\d+) pts\)/);
              if (match) {
                const [, name, pts] = match;
                return `+${pts.padStart(2)} • ${name}`;
              }
            }
            return `• ${entry}`;
          })
          .join('\n');

      if (pending.length)
        embed.addFields({
          name: '⏳ Pending Submissions',
          value: formatList(pending),
          inline: false,
        });

      if (approved.length)
        embed.addFields({
          name: '✅ Approved Submissions',
          value: formatList(approved, true),
          inline: false,
        });

      if (rejected.length)
        embed.addFields({
          name: '❌ Rejected Submissions',
          value: formatList(rejected),
          inline: false,
        });

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to fetch submissions:', err);
      await interaction.reply({ content: '❌ Failed to fetch submissions.', flags: MessageFlags.Ephemeral });
    }
  }
};
