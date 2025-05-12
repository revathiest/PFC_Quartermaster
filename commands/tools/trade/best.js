const DEBUG_BEST = true;  // 🔍 Flip on/off

const { SlashCommandSubcommandBuilder } = require('discord.js');
const { UexVehicle } = require('../../../config/database');
const { handleTradeBest, handleTradeBestCore } = require('../../../utils/trade/tradeHandlers');
const { TradeStateCache } = require('../../../utils/trade/handlers/shared');

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

    if (DEBUG_BEST) {
      console.log(`[BEST][execute] start`, {
        user: interaction.user.tag,
        fromLocation,
        shipQuery,
        cash
      });
    }

    // delegate all of the “best” logic to the handler
    TradeStateCache.set(interaction.user.id, { fromLocation, shipQuery, cash });
    await handleTradeBest(interaction, client, { fromLocation, shipQuery, cash });

    if (DEBUG_BEST) console.log(`[BEST][execute] done`);
  },

  // Select‐menu handler for when we had multiple variants
  async option(interaction, client) {
    if (DEBUG_BEST) {
      console.log(
        `[BEST][option] start`,
        { customId: interaction.customId, values: interaction.values }
      );
    }

    // only handle our “best” ship menu
    if (!interaction.customId.startsWith('trade::best::select_ship')) {
      if (DEBUG_BEST) console.log(`[BEST][option] ignored customId=${interaction.customId}`);
      return;
    }

    // 1) grab the cached state
    const state = TradeStateCache.get(interaction.user.id);
    TradeStateCache.delete(interaction.user.id);

    if (!state) {
      if (DEBUG_BEST) console.warn(
        `[BEST][option] no pending request for user=${interaction.user.tag}`
      );
      return interaction.deferUpdate();
    }

    // 2) clear the menu
    await interaction.deferUpdate();
    if (DEBUG_BEST) console.log(`[BEST][option] menu cleared`);

    // 3) find the selected variant
    const selectedId = interaction.values[0];
    if (DEBUG_BEST) console.log(`[BEST][option] selectedId=${selectedId}`);

    const ship = await UexVehicle.findByPk(selectedId, { raw: true });
    if (!ship) {
      if (DEBUG_BEST) console.error(`[BEST][option] invalid ship id=${selectedId}`);
      return interaction.followUp({
        content: '❌ Could not find the selected ship.',
        flags: 1 << 6 // ephemeral
      });
    }
    if (DEBUG_BEST) console.log(`[BEST][option] user picked: ${ship.name_full}`);

    // 4) re‑invoke the slash‐command handler *using the original slash interaction*
    //    so that `.options.getString()` still works
    const result = await handleTradeBestCore({
      fromLocation: state.fromLocation,
      shipQuery: ship.name,
      cash: state.cash,
      userId: interaction.user.id
    });
    
    if (result.error) {
      return interaction.followUp({ content: result.error, ephemeral: true });
    }
    
    return interaction.followUp({ embeds: [result.embed], ephemeral: true });

    if (DEBUG_BEST) console.log(`[BEST][option] done`);
  }
};
