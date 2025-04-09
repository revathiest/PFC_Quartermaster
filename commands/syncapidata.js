const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
  syncManufacturers,
  syncVehicles,
  syncGalactapedia,
  syncUexVehicles,
} = require('../botactions/api/syncEndpoints');
const { isAdmin } = require('../botactions/userManagement/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('syncapidata')
    .setDescription('Sync all Star Citizen API data into the database (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  help: 'Admin-only command to sync all Star Citizen API data into the bot database. Displays live progress as it works.',
  category: 'Admin',

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
      const pad = (str, len) => String(str).padEnd(len, ' ');
      const headers = ['Endpoint', 'New', 'Updated', 'Skipped', 'Total'];
      const colWidths = [15, 6, 8, 8, 6];
    
      const formatRow = (row) =>
        '| ' + row.map((val, i) => pad(val, colWidths[i])).join('|') + '|';
    
      const headerRow = formatRow(headers);
      const dividerRow = '| ' + colWidths.map(w => '-'.repeat(w)).join('|') + '|';
      const dataRows = Object.entries(results).map(([key, res]) =>
        formatRow([
          key,
          res.created ?? 0,
          res.updated ?? 0,
          res.skipped ?? 0,
          res.total ?? 0
        ])
      );
    
      return '```\n' +
      [headerRow, dividerRow, ...dataRows].join('\n') +
      '\n```';
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
    await updateStep('galactapedia', syncGalactapedia);
    await updateStep('uex_vehicles', syncUexVehicles);

    embed.title = '✅ API Sync Complete';
    embed.color = 0x00ff99;
    embed.description = getFormattedTable();
    embed.timestamp = new Date().toISOString();

    await interaction.editReply({ embeds: [embed] });
  }
};
