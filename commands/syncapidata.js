const { SlashCommandBuilder } = require('discord.js');
const {
  syncManufacturers,
  syncVehicles,
  syncShops
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

    const results = {};
    const getFormattedTable = () => {
      const headers = ['Endpoint', 'New', 'Updated', 'Skipped', 'Total'];
      const rows = Object.entries(results).map(([key, res]) => [
        key.padEnd(15),
        String(res.created ?? 0).padStart(5),
        String(res.updated ?? 0).padStart(7),
        String(res.skipped ?? 0).padStart(7),
        String(res.total ?? 0).padStart(5)
      ]);

      const formatRow = (row) => `| ${row.join(' | ')} |`;

      const lines = [
        formatRow(headers),
        `|${headers.map(() => '---').join('|')}|`,
        ...rows.map(formatRow)
      ];

      return '```markdown\n' + lines.join('\n') + '\n```';
    };

    const embed = {
      color: 0x00ff99,
      title: '⏳ API Sync In Progress',
      description: 'Starting sync...',
      timestamp: new Date().toISOString()
    };

    await interaction.editReply({ embeds: [embed] });

    // Run syncs one-by-one, updating after each
    const updateStep = async (label, fn) => {
      try {
        results[label] = await fn();
      } catch (err) {
        console.error(`[SYNC ERROR] ${label}:`, err);
        results[label] = { created: 0, updated: 0, skipped: 0, total: 0, error: true };
      }

      embed.description = getFormattedTable();
      embed.title = '🔄 Syncing API Data...';
      await interaction.editReply({ embeds: [embed] });
    };

    await updateStep('manufacturers', syncManufacturers);
    await updateStep('vehicles', syncVehicles);
    await updateStep('shops', syncShops);

    embed.title = '✅ API Sync Complete';
    embed.color = 0x00ff99;
    embed.description = getFormattedTable();
    embed.timestamp = new Date().toISOString();

    await interaction.editReply({ embeds: [embed] });
  }
};
