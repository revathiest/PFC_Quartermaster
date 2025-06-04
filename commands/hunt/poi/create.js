const { SlashCommandSubcommandBuilder, MessageFlags } = require('discord.js');
const { HuntPoi } = require('../../../config/database');
const { createDriveClient, uploadScreenshot } = require('../../../utils/googleDrive');
const fetch = require('node-fetch');

const allowedRoles = ['Admiral', 'Fleet Admiral', 'Commodore', 'Captain', 'Commander'];

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('create')
    .setDescription('Create a point of interest')
    .addStringOption(opt => opt.setName('name').setDescription('POI name').setRequired(true))
    .addStringOption(opt => opt.setName('hint').setDescription('Hint for hunters').setRequired(true))
    .addStringOption(opt => opt.setName('location').setDescription('Location').setRequired(true))
    .addIntegerOption(opt => opt.setName('points').setDescription('Point value').setRequired(true))
    .addAttachmentOption(opt => opt.setName('image').setDescription('Image file').setRequired(false)),

  async execute(interaction) {
    const memberRoles = interaction.member?.roles?.cache?.map(r => r.name) || [];
    if (!allowedRoles.some(r => memberRoles.includes(r))) {
      await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
      return;
    }

    const name = interaction.options.getString('name');
    const hint = interaction.options.getString('hint');
    const location = interaction.options.getString('location');
    const attachment = interaction.options.getAttachment('image');
    const points = interaction.options.getInteger('points');
    const userId = interaction.user.id;

    try {
      let imageUrl = null;
      if (attachment) {
        const drive = await createDriveClient();
        const rootFolder = process.env.GOOGLE_DRIVE_HUNT_FOLDER;

        const response = await fetch(attachment.url);
        if (!response.ok) throw new Error('Failed to fetch attachment');
        const buffer = await response.buffer();
        const mime = attachment.contentType || response.headers.get('content-type');
        const pad = n => n.toString().padStart(2, '0');
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
        const sanitizedName = name.replace(/\s+/g, '_');
        const fileName = `${sanitizedName}_${timestamp}.jpg`;
        const file = await uploadScreenshot(drive, rootFolder, 'reference', fileName, buffer, mime);
        imageUrl = file.webViewLink;
      }

      await HuntPoi.create({
        name,
        hint,
        location,
        image_url: imageUrl,
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
