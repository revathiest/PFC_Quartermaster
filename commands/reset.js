const { SlashCommandBuilder } = require('@discordjs/builders');
const { exec } = require('child_process');
const { InteractionCollector } = require('discord.js');
const { join } = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Restarts the Quartermaster (Admin only)'),

  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: 'Only an administrator can do that. Your attempt has been logged.',
        ephemeral: true
      });
    }

    const username = interaction.member.user.tag;
    try {
      console.log(`Server shut down by: ${username}`);
      await interaction.reply('Resetting...');
  
      // Unregister all commands
      const globalCommands = await interaction.client.application.commands.fetch();
      const guildCommands = await interaction.guild.commands.fetch();

      try {
        await Promise.all(guildCommands.map(command => command.delete()));
        console.log('All commands deleted successfully.');
        process.exit(0);
      } catch (error) {
        console.error('Error occurred while deleting commands:', error);
        process.exit(1);
      }
    
    } catch (error) {
      console.error(`Error occurred while trying to shut down the bot: ${error}`);
      await interaction.reply({
        content: 'An error occurred while trying to shut down the bot.',
        ephemeral: true
      });
    }
  }
};
