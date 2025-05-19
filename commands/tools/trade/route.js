const DEBUG_ROUTE = false;

// commands/tools/trade/route.js
const { SlashCommandSubcommandBuilder } = require('discord.js');
const { handleTradeRoute } = require('../../../utils/trade/handlers/route');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('route')
    .setDescription('Show profitable trades between two specific locations')
    .addStringOption(opt =>
      opt.setName('from')
        .setDescription('The origin location')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('to')
        .setDescription('The destination location')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const from = interaction.options.getString('from');
    const to = interaction.options.getString('to');
    await handleTradeRoute(interaction, client, { from, to });
  },

  async option(interaction, client){
    
  }
};
