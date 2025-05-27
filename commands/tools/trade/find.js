const { SlashCommandSubcommandBuilder } = require('discord.js');
const { handleTradeFind } = require('../../../utils/trade/tradeHandlers');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('find')
    .setDescription('Search best places to buy or sell a commodity')
    .addStringOption(opt =>
      opt.setName('commodity')
        .setDescription('Commodity to search for')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('buy or sell')
        .setRequired(true)
        .addChoices(
          { name: 'buy', value: 'buy' },
          { name: 'sell', value: 'sell' }
        ))
    .addStringOption(opt =>
      opt.setName('near')
        .setDescription('Optional location to filter'))
    .addIntegerOption(opt =>
      opt.setName('max_distance')
        .setDescription('Maximum distance filter')),

  async execute(interaction) {
    await handleTradeFind(interaction);
  }
};
