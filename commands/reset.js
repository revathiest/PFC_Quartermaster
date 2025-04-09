const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Restarts the Quartermaster (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    help: 'Resets the bot and removes all registered commands. Admin only.',
    category: 'Admin',

  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: 'Only an administrator can do that. Your attempt has been logged.',
        ephemeral: true
      });
    }

    const username = interaction.member.user.tag;
    try {
      console.log(`Server shut down initiated by: ${username}`);
      await interaction.reply('Resetting...');

      // Unregister all commands
      const globalCommands = await interaction.client.application.commands.fetch();
      const guildCommands = await interaction.guild.commands.fetch();

      try {
        await Promise.all([
          ...globalCommands.map(command => command.delete()),
          ...guildCommands.map(command => command.delete())
        ]);

        console.log('All commands deleted successfully.');
        console.log('Completing server shutdown.');
        process.exit(0);
      } catch (error) {
        console.error('Error occurred while deleting commands:', error);
        process.exit(1);
      }
    
    } catch (error) {
      console.error(`Error occurred while trying to shut down the bot: ${error}`);
      try {
        await interaction.editReply({
          content: 'An error occurred while trying to shut down the bot.',
          ephemeral: true
        });
      } catch (editError) {
        console.error('Failed to edit the interaction reply:', editError);
      }
    }
  }
};
