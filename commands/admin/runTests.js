const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('runtests')
    .setDescription('Runs automated bot tests and returns the results as a file.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'System',
  help: 'Runs the bot\'s unit tests and uploads the results as a file. (Admin Only)',

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    exec('npm run test', { timeout: 60 * 1000 }, async (error, stdout, stderr) => {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
      const filename = `test-results-${timestamp}.txt`;
      const filepath = path.join(__dirname, filename);

      let output = `=== Test Run @ ${now.toISOString()} ===\n\n`;

      if (error) {
        output += `❌ Error:\n${error.message}\n\n`;
      }
      if (stderr) {
        output += `⚠️ STDERR:\n${stderr}\n\n`;
      }
      output += `✅ STDOUT:\n${stdout}\n`;

      try {
        fs.writeFileSync(filepath, output, 'utf8');

        const file = new AttachmentBuilder(filepath);
        await interaction.editReply({
          content: '🧪 Test run complete! Here are the results:',
          files: [file],
          flags: MessageFlags.Ephemeral,
        });

        // Clean up the file after sending
        setTimeout(() => {
          fs.unlink(filepath, (err) => {
            if (err) console.error(`⚠️ Failed to delete test file ${filename}:`, err);
            else console.log(`🧹 Cleaned up test file ${filename}`);
          });
        }, 10000); // Give Discord a few seconds before deleting
      } catch (err) {
        console.error('❌ Failed to handle test output file:', err);
        await interaction.editReply({ content: '❌ Test ran but failed to upload output.', flags: MessageFlags.Ephemeral });
      }
    });
  }
};
