const { SlashCommandSubcommandBuilder, MessageFlags } = require('discord.js');
const { UexVehicle } = require('../../../config/database');
const { handleTradeBest, handleTradeBestCore } = require('../../../utils/trade/tradeHandlers');
const { TradeStateCache, safeReply } = require('../../../utils/trade/handlers/shared');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('best')
    .setDescription('Find the best trade from a location.')
    .addStringOption(opt =>
      opt.setName('from')
        .setDescription('Starting location')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('with')
        .setDescription('Ship name (optional)'))
    .addIntegerOption(opt =>
      opt.setName('cash')
        .setDescription('Available cash (default: use full cargo)')),

  // Slash‐command entrypoint
  async execute(interaction, client) {
    const fromLocation = interaction.options.getString('from');
    const shipQuery    = interaction.options.getString('with');
    const cash         = interaction.options.getInteger('cash') ?? null;

    console.log(`[BEST][execute] start`, {
      user: interaction.user.tag,
      fromLocation,
      shipQuery,
      cash
    });

    // delegate all of the “best” logic to the handler
    TradeStateCache.set(interaction.user.id, { fromLocation, shipQuery, cash });
    await handleTradeBest(interaction, client, { fromLocation, shipQuery, cash });

  },

  // Select‐menu handler for when we had multiple variants
  async option(interaction, client) {
    console.log(
      `[BEST][option] start`,
      { customId: interaction.customId, values: interaction.values }
    );

    // only handle our “best” ship menu
    if (!interaction.customId.startsWith('trade::best::select_ship')) {
      return;
    }

    // 1) grab the cached state
    const state = TradeStateCache.get(interaction.user.id);
    TradeStateCache.delete(interaction.user.id);

    if (!state) {
      console.log(
        `[BEST][option] no pending request for user=${interaction.user.tag}`
      );
      return interaction.deferUpdate();
    }

    // 2) clear the menu
    await interaction.deferUpdate();

    // 3) find the selected variant
    const selectedId = interaction.values[0];

    const ship = await UexVehicle.findByPk(selectedId, { raw: true });
    if (!ship) {
      return safeReply(interaction, {
        content: '❌ Could not find the selected ship.',
        flags: MessageFlags.Ephemeral
      });      
    }

    // 4) re‑invoke the slash‐command handler *using the original slash interaction*
    //    so that `.options.getString()` still works
    const result = await handleTradeBestCore({
      fromLocation: state.fromLocation,
      ship: ship,
      cash: state.cash,
      userId: interaction.user.id
    });
    
    const payload = result.error
    ? { content: result.error, flags: MessageFlags.Ephemeral }
    : result.components
      ? { content: result.content ?? '', components: result.components, flags: MessageFlags.Ephemeral }
      : { embeds: [result.embed], flags: MessageFlags.Ephemeral };
      
  
    return safeReply(interaction, payload);  

  }
};
