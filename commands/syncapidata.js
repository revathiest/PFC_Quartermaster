const { SlashCommandBuilder } = require('discord.js');
const {
  syncManufacturers,
  syncVehicles
  // add more sync functions here when needed
} = require('../botactions/api/syncEndpoints');
const { isAdmin } = require('../botactions/userManagement/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('syncapidata')
    .setDescription('Sync all Star Citizen API data into the database (admin only)'),

  async execute(interaction) {
    if (!(await isAdmin(interaction.member))) {
      return interaction.reply({
        content: '❌ You do not have permission to run this command.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const results = {};

      results.manufacturers = await syncManufacturers();
      results.vehicles = await syncVehicles();

      const embed = {
        color: 0x00ff99,
        title: '✅ API Sync Complete',
        description: `All available endpoints were synced successfully.`,
        fields: Object.entries(results).flatMap(([key, result]) => [
          { name: `📦 ${key.charAt(0).toUpperCase() + key.slice(1)}`, value: '\u200B' },
          { name: 'New Records', value: `${result.created || 0}`, inline: true },
          { name: 'Updated Records', value: `${result.updated || 0}`, inline: true },
          { name: 'Skipped', value: `${result.skipped || 0}`, inline: true },
          { name: 'Total Fetched', value: `${result.total || 0}`, inline: true },
        ]),
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[SYNC ERROR]', err);
      await interaction.editReply({
        content: '❌ Something went wrong while syncing API data.',
        ephemeral: true
      });
    }
  }
};
