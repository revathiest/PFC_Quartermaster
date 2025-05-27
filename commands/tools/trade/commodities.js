const { SlashCommandSubcommandBuilder } = require('discord.js');
const { handleTradeCommodities } = require('../../../utils/trade/tradeHandlers');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('commodities')
    .setDescription('Show commodity prices at a location')
    .addStringOption(opt =>
      opt.setName('location')
        .setDescription('Location to query')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('filter')
        .setDescription('Optional filter')),

  async execute(interaction) {
    await handleTradeCommodities(interaction);
  }
};
