const {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const { HuntPoi } = require('../../../config/database');

const PAGE_SIZE = 10;

function chunkArray(arr, size) {
  const pages = [];
  for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
  return pages;
}

function buildEmbed(pois, page, totalPages) {
  const embed = new EmbedBuilder()
    .setTitle('Points of Interest')
    .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

  for (const poi of pois) {
    embed.addFields({ name: `${poi.name} (${poi.points} pts)`, value: poi.hint });
  }
  return embed;
}

async function sendPage(interaction, page) {
  const pois = await HuntPoi.findAll({ where: { status: 'active' }, order: [['name', 'ASC']] });
  if (!pois.length) {
    const method = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
    return interaction[method]({ content: '❌ No POIs found.', flags: MessageFlags.Ephemeral });
  }

  const chunks = chunkArray(pois, PAGE_SIZE);
  const pageNum = Math.min(Math.max(page, 0), chunks.length - 1);
  const embed = buildEmbed(chunks[pageNum] || [], pageNum, chunks.length);

  const components = [];
  if (chunks.length > 1) {
    components.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`hunt_poi_page::${pageNum - 1}`)
        .setLabel('◀️ Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageNum === 0),
      new ButtonBuilder()
        .setCustomId(`hunt_poi_page::${pageNum + 1}`)
        .setLabel('▶️ Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageNum >= chunks.length - 1)
    ));
  }

  const method = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
  return interaction[method]({ embeds: [embed], components, flags: MessageFlags.Ephemeral });
}

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('List available POIs'),

  async execute(interaction) {
    try {
      await sendPage(interaction, 0);
    } catch (err) {
      console.error('❌ Failed to list POIs:', err);
      const method = interaction.replied ? 'editReply' : 'reply';
      await interaction[method]({ content: '❌ Error fetching POIs.', flags: MessageFlags.Ephemeral });
    }
  },

  async button(interaction) {
    if (!interaction.customId.startsWith('hunt_poi_page::')) return;
    const [, pageStr] = interaction.customId.split('::');
    const page = parseInt(pageStr, 10) || 0;
    await interaction.deferUpdate();
    try {
      await sendPage(interaction, page);
    } catch (err) {
      console.error('❌ Failed to paginate POIs:', err);
    }
  }
};
