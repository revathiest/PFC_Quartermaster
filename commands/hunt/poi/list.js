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
const { HuntPoi, Hunt, HuntSubmission, Config } = require('../../../config/database');
const { createDriveClient, uploadScreenshot } = require('../../../utils/googleDrive');
const fetch = require('node-fetch');

const allowedRoles = ['Admiral', 'Fleet Admiral'];

const PAGE_SIZE = 10;

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

function buildSubmitRow(poiId, page) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`hunt_poi_submit::${poiId}::${page}`)
      .setLabel('📸 Submit Proof')
      .setStyle(ButtonStyle.Primary)
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
  components.push(buildSelectRow(pagePois, pageNum));
  if (highlightId) {
    if (isAdmin) components.push(buildActionRow(highlightId, pageNum));
    else components.push(buildSubmitRow(highlightId, pageNum));
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
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
            .setCustomId(`hunt_poi_edit_form::${poiId}`)
            .setTitle(`Edit POI - ${poi.name}`);

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
          new ActionRowBuilder().addComponents(descriptionInput),
          new ActionRowBuilder().addComponents(hintInput),
          new ActionRowBuilder().addComponents(locationInput),
          new ActionRowBuilder().addComponents(imageInput),
          new ActionRowBuilder().addComponents(pointsInput)
        );

        return interaction.showModal(modal);
      } catch (err) {
        console.error('❌ Failed to build edit modal:', err);
      }
      return;
    }

    if (interaction.customId.startsWith('hunt_poi_submit::')) {
      const [, poiId] = interaction.customId.split('::');
      await interaction.reply({
        content: 'Please upload your screenshot now.',
        flags: MessageFlags.Ephemeral
      });

      const filter = m => m.author.id === interaction.user.id && m.attachments.size > 0;
      let collected;
      try {
        collected = await interaction.channel.awaitMessages({
          filter,
          max: 1,
          time: 60000,
          errors: ['time']
        });
      } catch (err) {
        return interaction.followUp({
          content: '❌ Timed out waiting for file upload.',
          flags: MessageFlags.Ephemeral
        });
      }

      const msg = collected.first();
      const attachment = msg.attachments.first();

      const botType = process.env.BOT_TYPE || 'development';
      try {
        const hunt = await Hunt.findOne({ where: { status: 'active' } });
        if (!hunt) {
          return interaction.followUp({ content: '❌ No active hunt.', flags: MessageFlags.Ephemeral });
        }

        const activityConfig = await Config.findOne({
          where: { key: 'hunt_activity_channel', botType }
        });
        const reviewConfig = await Config.findOne({
          where: { key: 'hunt_review_channel', botType }
        });
        const drive = await createDriveClient();
        const rootFolder = process.env.GOOGLE_DRIVE_HUNT_FOLDER;

        const poi = await HuntPoi.findByPk(poiId);
        if (!poi) {
          return interaction.followUp({ content: '❌ POI not found.', flags: MessageFlags.Ephemeral });
        }

        const response = await fetch(attachment.url);
        if (!response.ok) throw new Error('Failed to fetch attachment');
        const buffer = await response.buffer();
        const mime = attachment.contentType || response.headers.get('content-type');
        const folderName = interaction.member?.displayName || interaction.user.username;
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
        const sanitizedName = poi.name.replace(/\s+/g, '_');
        const fileName = `${sanitizedName}_${timestamp}.jpg`;
        const file = await uploadScreenshot(
          drive,
          rootFolder,
          folderName,
          fileName,
          buffer,
          mime
        );

        const submission = await HuntSubmission.create({
          hunt_id: hunt.id,
          poi_id: poiId,
          user_id: interaction.user.id,
          image_url: file.webViewLink,
          status: 'pending'
        });

        if (activityConfig) {
          const ch = await interaction.client.channels.fetch(activityConfig.value);
          await ch.send(`<@${interaction.user.id}> submitted evidence for POI ${poiId}`);
        }
        if (reviewConfig) {
          const ch = await interaction.client.channels.fetch(reviewConfig.value);
          const reviewMsg = await ch.send({
            content: `Submission from <@${interaction.user.id}> for POI ${poi.name}: ${file.webViewLink}`,
            components: [new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`hunt_poi_approve::${submission.id}`)
                .setLabel('Approve')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`hunt_poi_reject::${submission.id}`)
                .setLabel('Reject')
                .setStyle(ButtonStyle.Danger)
            )]
          });
          await submission.update({ review_channel_id: ch.id, review_message_id: reviewMsg.id });
        }

        await interaction.followUp({ content: '✅ Submission received.', flags: MessageFlags.Ephemeral });
      } catch (err) {
        console.error('❌ Failed to submit proof:', err);
        await interaction.followUp({ content: '❌ Failed to submit proof.', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    if (interaction.customId.startsWith('hunt_poi_approve::')) {
      const [, submissionId] = interaction.customId.split('::');
      await interaction.deferUpdate();
      try {
        const sub = await HuntSubmission.findByPk(submissionId);
        if (!sub) return;
        await sub.update({ status: 'approved', reviewer_id: interaction.user.id, reviewed_at: new Date() });
        try {
          if (sub.review_channel_id && sub.review_message_id) {
            const ch = await interaction.client.channels.fetch(sub.review_channel_id);
            const msg = await ch.messages.fetch(sub.review_message_id);
            await msg.edit({ content: `${msg.content}\n✅ Approved by <@${interaction.user.id}>`, components: [] });
          }
        } catch (err) {
          console.error('❌ Failed to update review message:', err);
        }
      } catch (err) {
        console.error('❌ Failed to approve submission:', err);
      }
      return;
    }

    if (interaction.customId.startsWith('hunt_poi_reject::')) {
      const [, submissionId] = interaction.customId.split('::');
      const modal = new ModalBuilder()
        .setCustomId(`hunt_poi_reject_form::${submissionId}`)
        .setTitle('Reject Submission');
      const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Reason')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
      return interaction.showModal(modal);
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

    if (interaction.customId.startsWith('hunt_poi_edit_form::')) {
      const [, poiId] = interaction.customId.split('::');
      const description = interaction.fields.getTextInputValue('description');
      const hint = interaction.fields.getTextInputValue('hint');
      const location = interaction.fields.getTextInputValue('location');
      const image = interaction.fields.getTextInputValue('image');
      const points = parseInt(interaction.fields.getTextInputValue('points'), 10);

      try {
        const poi = await HuntPoi.findByPk(poiId);
        if (!poi) {
          return interaction.reply({ content: '❌ POI not found.', flags: MessageFlags.Ephemeral });
        }

        await poi.update({
          description: description || null,
          hint: hint || null,
          location: location || null,
          image_url: image || null,
          points,
          updated_by: interaction.user.id
        });

        await interaction.reply({ content: '✅ POI updated.', flags: MessageFlags.Ephemeral });
      } catch (err) {
        console.error('❌ Failed to update POI:', err);
        await interaction.reply({ content: '❌ Failed to update POI.', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    if (interaction.customId.startsWith('hunt_poi_reject_form::')) {
      const [, subId] = interaction.customId.split('::');
      const reason = interaction.fields.getTextInputValue('reason');
      try {
        const sub = await HuntSubmission.findByPk(subId);
        if (!sub) {
          return interaction.reply({ content: '❌ Submission not found.', flags: MessageFlags.Ephemeral });
        }

        await sub.update({
          status: 'rejected',
          review_comment: reason,
          reviewer_id: interaction.user.id,
          reviewed_at: new Date()
        });

        try {
          if (sub.review_channel_id && sub.review_message_id) {
            const ch = await interaction.client.channels.fetch(sub.review_channel_id);
            const msg = await ch.messages.fetch(sub.review_message_id);
            await msg.edit({ content: `${msg.content}\n❌ Rejected by <@${interaction.user.id}>: ${reason}`, components: [] });
          }
        } catch (err) {
          console.error('❌ Failed to update review message:', err);
        }

        await interaction.reply({ content: '✅ Submission rejected.', flags: MessageFlags.Ephemeral });
      } catch (err) {
        console.error('❌ Failed to reject submission:', err);
        await interaction.reply({ content: '❌ Failed to reject submission.', flags: MessageFlags.Ephemeral });
      }
    }
  }
};
