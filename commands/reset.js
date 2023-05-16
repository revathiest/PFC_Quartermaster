const { SlashCommandBuilder } = require('@discordjs/builders');
const { botPermsReq } = require('./../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Restarts the Quartermaster (Admin only)'),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply('Only an administrator can do that. Your attempt has been logged.');
    }

    interaction.reply('Resetting...').then(() => {
      process.exit(0);
    });
  }
};
