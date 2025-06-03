const {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags
} = require('discord.js');
const { Hunt, HuntSubmission, HuntPoi } = require('../../config/database');
const { getActiveHunt } = require('../../utils/hunt');

async function generateLeaderboardEmbed(hunt) {
  const allSubs = await HuntSubmission.findAll({
    where: { hunt_id: hunt.id },
    order: [['submitted_at', 'ASC']]
  });

  const embed = new EmbedBuilder()
    .setTitle(`🏅 ${hunt.name} Leaderboard`)
    .setColor('Gold')
    .setFooter({ text: 'Top hunters ranked by total points' })
    .setTimestamp();

  if (!allSubs.length) {
    embed.setDescription('❌ No submissions yet for this hunt.');
    return { embed };
  }

  const supersededIds = new Set(allSubs.map(s => s.supersedes_submission_id).filter(Boolean));
  const submissions = allSubs.filter(
    s => s.status === 'approved' && !supersededIds.has(s.id)
  );

  if (!submissions.length) {
    embed.setDescription('❌ No approved submissions yet for this hunt.');
    return { embed };
  }

  const poiIds = [...new Set(submissions.map(s => s.poi_id))];
  const pois = await HuntPoi.findAll({ where: { id: poiIds } });
  const poiMap = new Map(pois.map(p => [p.id, p]));

  const scores = new Map();
  for (const sub of submissions) {
    const poi = poiMap.get(sub.poi_id);
    const points = poi ? poi.points : 0;
    const data = scores.get(sub.user_id) || { points: 0, latest: new Date(0) };
    data.points += points;
    const subTime = new Date(sub.submitted_at);
    if (subTime > data.latest) data.latest = subTime;
    scores.set(sub.user_id, data);
  }

  const entries = Array.from(scores.entries()).map(([userId, data]) => ({ userId, ...data }));
  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.latest - a.latest;
  });

  const medals = ['🥇', '🥈', '🥉'];
  const list = entries
    .map((entry, index) => {
      const rank = medals[index] ?? `#${index + 1}`;
      const paddedPoints = entry.points.toString().padStart(3, ' ');
      return `${rank} ${paddedPoints} pts — <@${entry.userId}>`;
    })
    .join('\n');

  embed.setDescription(list);
  return { embed };
}

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('leaderboard')
    .setDescription('Show leaderboard for the current or most recent hunt'),

  async execute(interaction) {
    try {
      let hunt = await getActiveHunt();
      if (!hunt) {
        hunt = await Hunt.findOne({ order: [['starts_at', 'DESC']] });
      }
      if (!hunt) {
        return interaction.reply({ content: '❌ No scavenger hunts found.', flags: MessageFlags.Ephemeral });
      }

      const { embed } = await generateLeaderboardEmbed(hunt);

      const hunts = await Hunt.findAll({ order: [['starts_at', 'DESC']] });
      const menu = new StringSelectMenuBuilder()
        .setCustomId('hunt_leaderboard_select')
        .setPlaceholder('Select a hunt')
        .addOptions(hunts.map(h => ({ label: h.name, value: h.id })));

      const row = new ActionRowBuilder().addComponents(menu);

      await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to build leaderboard:', err);
      await interaction.reply({ content: '❌ Failed to load leaderboard.', flags: MessageFlags.Ephemeral });
    }
  },

  async option(interaction) {
    if (interaction.customId !== 'hunt_leaderboard_select') return;

    const huntId = interaction.values[0];
    try {
      const hunt = await Hunt.findByPk(huntId);
      if (!hunt) {
        return interaction.update({ content: '❌ Hunt not found.', components: [], flags: MessageFlags.Ephemeral });
      }

      const { embed } = await generateLeaderboardEmbed(hunt);

      const hunts = await Hunt.findAll({ order: [['starts_at', 'DESC']] });
      const menu = new StringSelectMenuBuilder()
        .setCustomId('hunt_leaderboard_select')
        .setPlaceholder('Select a hunt')
        .addOptions(hunts.map(h => ({ label: h.name, value: h.id })));
      const row = new ActionRowBuilder().addComponents(menu);

      await interaction.update({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to update leaderboard:', err);
      await interaction.update({ content: '❌ Failed to load leaderboard.', components: [], flags: MessageFlags.Ephemeral });
    }
  }
};
