const { SlashCommandSubcommandBuilder } = require('discord.js');
const { handleTradePrice } = require('../../../utils/trade/tradeHandlers');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('price')
    .setDescription('Get commodity prices')
    .addStringOption(opt =>
      opt.setName('commodity')
        .setDescription('Commodity name')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('location')
        .setDescription('Optional location to check')),

  async execute(interaction) {
    await handleTradePrice(interaction);
  }
};
