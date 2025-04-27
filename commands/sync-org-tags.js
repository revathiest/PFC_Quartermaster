const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { syncOrgTags } = require('../botactions/orgTagSync/syncOrgTags');
const { canRunManualSync, markManualSyncRun } = require('../botactions/orgTagSync/syncCooldownTracker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sync-org-tags')
    .setDescription('Manually trigger the org tag synchronization (admins only).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!canRunManualSync()) {
      await interaction.reply({ content: 'Sync was run recently. Please wait before running again.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.reply({ content: 'Running org tag sync now...', flags: MessageFlags.Ephemeral });
    await syncOrgTags(interaction.client);
    markManualSyncRun();
    await interaction.followUp({ content: 'Org tag sync completed successfully.', flags: MessageFlags.Ephemeral });
  },
};
