const {
  SlashCommandSubcommandBuilder,
  MessageFlags
} = require('discord.js');
const { Hunt, HuntSubmission, Config } = require('../../../config/database');
const { createDriveClient, uploadScreenshot } = require('../../../utils/googleDrive');
const fetch = require('node-fetch');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('upload')
    .setDescription('Upload screenshot proof for a POI')
    .addStringOption(opt =>
      opt.setName('poi_id').setDescription('POI ID').setRequired(true))
    .addAttachmentOption(opt =>
      opt.setName('image').setDescription('Screenshot file').setRequired(true)),

  async execute(interaction) {
    const poiId = interaction.options.getString('poi_id');
    const attachment = interaction.options.getAttachment('image');

    const botType = process.env.BOT_TYPE || 'development';
    try {
      const hunt = await Hunt.findOne({ where: { status: 'active' } });
      if (!hunt) {
        return interaction.reply({ content: '❌ No active hunt.', flags: MessageFlags.Ephemeral });
      }
      const activityConfig = await Config.findOne({ where: { key: 'hunt_activity_channel', botType } });
      const reviewConfig = await Config.findOne({ where: { key: 'hunt_review_channel', botType } });
      const drive = await createDriveClient();
      const rootFolder = process.env.GOOGLE_DRIVE_HUNT_FOLDER;

      const response = await fetch(attachment.url);
      if (!response.ok) throw new Error('Failed to fetch attachment');
      const buffer = await response.buffer();
      const mime = attachment.contentType || response.headers.get('content-type');
      const file = await uploadScreenshot(drive, rootFolder, interaction.user.id, `${poiId}.jpg`, buffer, mime);

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
        const msg = await ch.send(`Submission from <@${interaction.user.id}> for POI ${poiId}: ${file.webViewLink}`);
        await submission.update({ review_channel_id: ch.id, review_message_id: msg.id });
      }

      return interaction.reply({ content: '✅ Submission received.', flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to submit proof:', err);
      return interaction.reply({ content: '❌ Failed to submit proof.', flags: MessageFlags.Ephemeral });
    }
  }
};
