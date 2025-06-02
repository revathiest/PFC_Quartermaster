const {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const { HuntPoi } = require('../../../config/database');

const allowedRoles = ['Admiral', 'Fleet Admiral'];

const PAGE_SIZE = 10;
const EDIT_TIMEOUT = 5 * 60 * 1000;
// key: `${userId}:${poiId}` -> { name, description, hint, timeout }
let pendingEdits = new Map();

function chunkArray(arr, size) {
  const pages = [];
  for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
  return pages;
}

function buildEmbed(pois, page, totalPages, highlightId) {
  const embed = new EmbedBuilder()
    .setTitle('Points of Interest')
    .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

  for (const poi of pois) {
    const name = `${poi.id === highlightId ? '➡️ ' : ''}${poi.name} (${poi.points} pts)`;
    embed.addFields({ name, value: poi.hint });
  }
  return embed;
}

function buildSelectRow(pois, page) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`hunt_poi_select::${page}`)
    .setPlaceholder('Select a POI')
    .addOptions(pois.map(p => ({ label: p.name, value: p.id })));
  return new ActionRowBuilder().addComponents(menu);
}

function buildActionRow(poiId, page) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`hunt_poi_edit::${poiId}::${page}`)
      .setLabel('✏️ Edit')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`hunt_poi_archive::${poiId}::${page}`)
      .setLabel('📦 Archive')
      .setStyle(ButtonStyle.Secondary)
  );
}

async function sendPage(interaction, page, highlightId, isAdmin) {
  const pois = await HuntPoi.findAll({ where: { status: 'active' }, order: [['name', 'ASC']] });
  if (!pois.length) {
    const method = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
    return interaction[method]({ content: '❌ No POIs found.', flags: MessageFlags.Ephemeral });
  }

  const chunks = chunkArray(pois, PAGE_SIZE);
  const pageNum = Math.min(Math.max(page, 0), chunks.length - 1);
  const pagePois = chunks[pageNum] || [];
  const embed = buildEmbed(pagePois, pageNum, chunks.length, highlightId);

  const components = [];
  if (isAdmin) {
    components.push(buildSelectRow(pagePois, pageNum));
    if (highlightId) components.push(buildActionRow(highlightId, pageNum));
  }

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
    const roles = interaction.member?.roles?.cache?.map(r => r.name) || [];
    const isAdmin = allowedRoles.some(r => roles.includes(r));
    try {
      await sendPage(interaction, 0, null, isAdmin);
    } catch (err) {
      console.error('❌ Failed to list POIs:', err);
      const method = interaction.replied ? 'editReply' : 'reply';
      await interaction[method]({ content: '❌ Error fetching POIs.', flags: MessageFlags.Ephemeral });
    }
  },

  async button(interaction) {
    if (interaction.customId.startsWith('hunt_poi_page::')) {
      const [, pageStr] = interaction.customId.split('::');
      const page = parseInt(pageStr, 10) || 0;
      await interaction.deferUpdate();
      const roles = interaction.member?.roles?.cache?.map(r => r.name) || [];
      const isAdmin = allowedRoles.some(r => roles.includes(r));
      try {
        await sendPage(interaction, page, null, isAdmin);
      } catch (err) {
        console.error('❌ Failed to paginate POIs:', err);
      }
      return;
    }

    if (interaction.customId.startsWith('hunt_poi_edit::')) {
      const [, poiId] = interaction.customId.split('::');
      try {
        const poi = await HuntPoi.findByPk(poiId);
        if (!poi) {
          return interaction.followUp({ content: '❌ POI not found.', flags: MessageFlags.Ephemeral });
        }
        const modal = new ModalBuilder()
          .setCustomId(`hunt_poi_edit_step1::${poiId}`)
          .setTitle('Edit POI (1/2)');

        const nameInput = new TextInputBuilder()
          .setCustomId('name')
          .setLabel('Name')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(poi.name);

        const descriptionInput = new TextInputBuilder()
          .setCustomId('description')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setValue(poi.description || '');

        const hintInput = new TextInputBuilder()
          .setCustomId('hint')
          .setLabel('Hint')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(poi.hint || '');

        modal.addComponents(
          new ActionRowBuilder().addComponents(nameInput),
          new ActionRowBuilder().addComponents(descriptionInput),
          new ActionRowBuilder().addComponents(hintInput)
        );

        return interaction.showModal(modal);
      } catch (err) {
        console.error('❌ Failed to build edit modal:', err);
      }
      return;
    }

    if (interaction.customId.startsWith('hunt_poi_archive::')) {
      const [, poiId, pageStr] = interaction.customId.split('::');
      const page = parseInt(pageStr, 10) || 0;
      await interaction.deferUpdate();
      try {
        const poi = await HuntPoi.findByPk(poiId);
        if (!poi) {
          return interaction.followUp({ content: '❌ POI not found.', flags: MessageFlags.Ephemeral });
        }
        await poi.update({ status: 'archived', updated_by: interaction.user.id });
        const roles = interaction.member?.roles?.cache?.map(r => r.name) || [];
        const isAdmin = allowedRoles.some(r => roles.includes(r));
        await sendPage(interaction, page, null, isAdmin);
      } catch (err) {
        console.error('❌ Failed to archive POI:', err);
      }
    }
  }
,
  async option(interaction) {
    if (!interaction.customId.startsWith('hunt_poi_select::')) return;
    const [, pageStr] = interaction.customId.split('::');
    const page = parseInt(pageStr, 10) || 0;
    const poiId = interaction.values[0];
    await interaction.deferUpdate();
    const roles = interaction.member?.roles?.cache?.map(r => r.name) || [];
    const isAdmin = allowedRoles.some(r => roles.includes(r));
    try {
      await sendPage(interaction, page, poiId, isAdmin);
    } catch (err) {
      console.error('❌ Failed to select POI:', err);
    }
  },

  async modal(interaction) {
    if (interaction.customId.startsWith('hunt_poi_edit_step1::')) {
      const [, poiId] = interaction.customId.split('::');
      const name = interaction.fields.getTextInputValue('name');
      const description = interaction.fields.getTextInputValue('description');
      const hint = interaction.fields.getTextInputValue('hint');

      try {
        const poi = await HuntPoi.findByPk(poiId);
        if (!poi) {
          return interaction.reply({ content: '❌ POI not found.', flags: MessageFlags.Ephemeral });
        }
        const key = `${interaction.user.id}:${poiId}`;
        if (pendingEdits.has(key)) clearTimeout(pendingEdits.get(key).timeout);
        const timeout = setTimeout(() => pendingEdits.delete(key), EDIT_TIMEOUT);
        pendingEdits.set(key, { name, description, hint, timeout });

        const modal = new ModalBuilder()
          .setCustomId(`hunt_poi_edit_step2::${poiId}`)
          .setTitle('Edit POI (2/2)');

        const locationInput = new TextInputBuilder()
          .setCustomId('location')
          .setLabel('Location')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(poi.location || '');

        const imageInput = new TextInputBuilder()
          .setCustomId('image')
          .setLabel('Image URL')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(poi.image_url || '');

        const pointsInput = new TextInputBuilder()
          .setCustomId('points')
          .setLabel('Points')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(String(poi.points));

        modal.addComponents(
          new ActionRowBuilder().addComponents(locationInput),
          new ActionRowBuilder().addComponents(imageInput),
          new ActionRowBuilder().addComponents(pointsInput)
        );

        return interaction.showModal(modal);
      } catch (err) {
        console.error('❌ Failed to build followup modal:', err);
        return interaction.reply({ content: '❌ Failed to build followup modal.', flags: MessageFlags.Ephemeral });
      }
    }

    if (!interaction.customId.startsWith('hunt_poi_edit_step2::')) return;
    const [, poiId] = interaction.customId.split('::');
    const key = `${interaction.user.id}:${poiId}`;
    const cache = pendingEdits.get(key);
    if (!cache) {
      return interaction.reply({ content: '❌ Edit session expired.', flags: MessageFlags.Ephemeral });
    }
    clearTimeout(cache.timeout);
    pendingEdits.delete(key);
    const location = interaction.fields.getTextInputValue('location');
    const image = interaction.fields.getTextInputValue('image');
    const points = parseInt(interaction.fields.getTextInputValue('points'), 10);

    try {
      await HuntPoi.update({
        name: cache.name,
        description: cache.description || null,
        hint: cache.hint || null,
        location: location || null,
        image_url: image || null,
        points,
        updated_by: interaction.user.id
      }, { where: { id: poiId } });
      await interaction.reply({ content: '✅ POI updated.', flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to update POI:', err);
      await interaction.reply({ content: '❌ Failed to update POI.', flags: MessageFlags.Ephemeral });
    }
  }
};
