const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { createDriveClient } = require('../../utils/googleDrive');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gdrivetest')
    .setDescription('Verify Google Drive permissions by creating a test file')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  help: 'Runs a series of Google Drive operations to confirm the bot has access.',
  category: 'Admin',
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Only administrators can use this command.',
        flags: MessageFlags.Ephemeral
      });
    }

    const rootFolderId = process.env.GOOGLE_DRIVE_TEST_FOLDER;
    if (!rootFolderId) {
      return interaction.reply({
        content: '❌ GOOGLE_DRIVE_TEST_FOLDER not configured.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      console.log('🛠️ Starting Google Drive test...');
      const drive = await createDriveClient();

      console.log('🛠️ Listing files...');
      await drive.files.list({
        q: `'${rootFolderId}' in parents and trashed=false`,
        fields: 'files(id,name)'
      });

      console.log('🛠️ Creating folder...');
      const folderRes = await drive.files.create({
        resource: { name: 'QMTest', mimeType: 'application/vnd.google-apps.folder', parents: [rootFolderId] },
        fields: 'id'
      });

      console.log('🛠️ Creating file...');
      const fileRes = await drive.files.create({
        resource: { name: 'test.txt', parents: [folderRes.data.id] },
        media: { mimeType: 'text/plain', body: 'Quartermaster Drive Test' },
        fields: 'id, webViewLink'
      });

      console.log('✅ Google Drive test complete');
      await interaction.editReply({ content: `✅ Created test file: ${fileRes.data.webViewLink}`, flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Drive test failed:', err);
      await interaction.editReply({ content: '❌ Drive test failed.', flags: MessageFlags.Ephemeral });
    }
  }
};
