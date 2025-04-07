const { SlashCommandBuilder } = require('discord.js');
const {
  syncManufacturers,
  syncVehicles,
  syncShops
  // add more sync functions here when needed
} = require('../botactions/api/syncEndpoints');
const { isAdmin } = require('../botactions/userManagement/permissions');
const pad = (str, len = 7) => String(str).padEnd(len);

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
      results.shops = await syncShops();

      const embed = {
        color: 0x00ff99,
        title: '✅ API Sync Complete',
        description: `All available endpoints were synced successfully.`,
        fields: [
          {
            name: '📊 Sync Summary',
            value: '```' +
              ['Endpoint     | New  | Updated | Skipped | Total']
                .concat(['------------|------|---------|---------|------'])
                .concat(Object.entries(results).map(([key, r]) => {
                  const label = pad(key, 12);
                  const created = pad(r.created ?? 0);
                  const updated = pad(r.updated ?? 0);
                  const skipped = pad(r.skipped ?? 0);
                  const total = pad(r.total ?? 0);
                  return `${label}| ${created}| ${updated}| ${skipped}| ${total}`;
                }))
                .join('\n') +
              '```'
          }
        ],
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
