const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { isAdmin } = require('../../botactions/userManagement/permissions');
const { runFullApiSync } = require('../../utils/apiSync/syncApiData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('syncapidata')
    .setDescription('Sync all Star Citizen API data into the database (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  category: 'Admin',

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        content: '❌ You do not have permission to run this command.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ ephemeral: true });
    await runFullApiSync(interaction); // 👈 we pass it in now
  }
};
