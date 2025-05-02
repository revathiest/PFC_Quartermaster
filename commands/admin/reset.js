const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Removes all bot commands and exits. (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  help: 'Resets the bot by clearing all registered commands (global and guild). Admin only.',
  category: 'System',

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'Only an administrator can do that. Your attempt has been logged.',
        flags: MessageFlags.Ephemeral
      });
    }

    const username = interaction.member.user.tag;

    try {
      console.log(`🛑 Command reset initiated by: ${username}`);
      await interaction.reply({ content: 'Resetting...', flags: MessageFlags.Ephemeral });

      // Bulk overwrite global and guild commands with empty arrays
      await Promise.all([
        interaction.client.application.commands.set([]), // global commands
        interaction.guild.commands.set([])              // guild-specific commands
      ]);

      console.log('✅ All commands have been removed.');
      console.log('🧨 Completing reset and shutting down...');
      process.exit(0);

    } catch (error) {
      console.error('❌ Error occurred during bot reset:', error);

      try {
        await interaction.editReply({
          content: '❌ An error occurred while resetting the commands.',
          flags: MessageFlags.Ephemeral
        });
      } catch (editError) {
        console.error('❗ Failed to edit the interaction reply:', editError);
      }
    }
  }
};
