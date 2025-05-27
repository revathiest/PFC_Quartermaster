const { SlashCommandSubcommandBuilder } = require('discord.js');
const { handleTradeBestCircuit } = require('../../../utils/trade/tradeHandlers');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('circuit')
    .setDescription('Plan a basic trade circuit')
    .addStringOption(opt =>
      opt.setName('start')
        .setDescription('Starting location'))
    .addIntegerOption(opt =>
      opt.setName('cargo_capacity')
        .setDescription('Ship cargo capacity in SCU'))
    .addStringOption(opt =>
      opt.setName('priority')
        .setDescription('Optimisation priority')
        .addChoices(
          { name: 'profit', value: 'profit' },
          { name: 'time', value: 'time' },
          { name: 'low-risk', value: 'low-risk' },
          { name: 'high-volume', value: 'high-volume' }
        ))
    .addIntegerOption(opt =>
      opt.setName('max_stops')
        .setDescription('Maximum stops in loop')), 

  async execute(interaction) {
    await handleTradeBestCircuit(interaction);
  }
};
