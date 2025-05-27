const { SlashCommandSubcommandBuilder } = require('discord.js');
const { handleTradeCommodities } = require('../../../utils/trade/tradeHandlers');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('commodities')
    .setDescription('List commodity prices at a location')
    .addStringOption(opt =>
      opt.setName('location')
        .setDescription('Location to check')
        .setRequired(true)),

  async execute(interaction) {
    await handleTradeCommodities(interaction);
  }
};
