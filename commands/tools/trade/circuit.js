const { SlashCommandSubcommandBuilder } = require('discord.js');
const { handleTradeBestCircuit } = require('../../../utils/trade/tradeHandlers');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('circuit')
    .setDescription('Plan a basic trade circuit')
    .addStringOption(opt =>
      opt.setName('from')
        .setDescription('Starting location')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('with')
        .setDescription('Ship name'))
    .addIntegerOption(opt =>
      opt.setName('cash')
        .setDescription('Available cash for trading')),

  async execute(interaction) {
    await handleTradeBestCircuit(interaction);
  }
};
