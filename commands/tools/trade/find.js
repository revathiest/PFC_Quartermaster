const { SlashCommandSubcommandBuilder } = require('discord.js');
const { handleTradeFind } = require('../../../utils/trade/tradeHandlers');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('find')
    .setDescription('Find profitable trades between two locations')
    .addStringOption(opt =>
      opt.setName('from')
        .setDescription('Origin location')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('to')
        .setDescription('Destination location')
        .setRequired(true)),

  async execute(interaction) {
    await handleTradeFind(interaction);
  }
};
