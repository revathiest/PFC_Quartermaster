const { SlashCommandSubcommandBuilder } = require('discord.js');
const { handleTradeCommodities } = require('../../../utils/trade/tradeHandlers');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('commodities')
    .setDescription('List known commodities'),

  async execute(interaction) {
    await handleTradeCommodities(interaction);
  }
};
