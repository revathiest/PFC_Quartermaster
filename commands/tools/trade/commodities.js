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
  },

  async button(interaction) {
    if (!interaction.customId.startsWith('trade_commodities_page::')) return;

    const [, location, pageStr] = interaction.customId.split('::');
    const page = parseInt(pageStr, 10) || 0;

    await handleTradeCommodities(interaction, { location, page });
  }
};
