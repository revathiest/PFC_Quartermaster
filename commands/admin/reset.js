const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Restarts the Quartermaster (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  help: 'Resets the bot and removes all registered commands. (Admin Only)',
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
      console.log(`🛑 Server shut down initiated by: ${username}`);
      await interaction.reply({ content: 'Resetting...', flags: MessageFlags.Ephemeral });

      // Fetch and delete commands
      const globalCommands = await interaction.client.application.commands.fetch();
      const guildCommands = await interaction.guild.commands.fetch();

      await Promise.all([
        ...[...globalCommands.values()].map(command => command.delete()),
        ...[...guildCommands.values()].map(command => command.delete())
      ]);

      console.log('✅ All commands deleted successfully.');
      console.log('🧨 Completing server shutdown...');
      process.exit(0);

    } catch (error) {
      console.error(`❌ Error occurred during bot reset:`, error);

      try {
        await interaction.editReply({
          content: '❌ An error occurred while trying to shut down the bot.',
          flags: MessageFlags.Ephemeral
        });
      } catch (editError) {
        console.error('❗ Failed to edit the interaction reply:', editError);
      }
    }
  }
};
