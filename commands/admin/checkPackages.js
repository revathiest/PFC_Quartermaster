const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check-packages')
    .setDescription('🔧 Check if certain packages are installed')
    .setDefaultMemberPermissions(0) // No perms = invisible to regular users
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const packages = ['tape', 'chai', 'jsdom', 'sinon'];
    const results = [];

    for (const pkg of packages) {
      try {
        require.resolve(pkg);
        results.push(`✅ **${pkg}** is installed`);
      } catch {
        results.push(`❌ **${pkg}** is NOT installed`);
      }
    }

    await interaction.reply({
      content: results.join('\n'),
      ephemeral: true,
    });
  },
};
