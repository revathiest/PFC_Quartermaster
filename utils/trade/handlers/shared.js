const { MessageFlags } = require('discord.js');

const DEBUG_TRADE = false;

const pendingBest = new Map();

async function safeReply(interaction, payload = {}) {
  if (!interaction || typeof interaction.reply !== 'function') {
    console.error('[safeReply] Invalid interaction object:', interaction);
    return;
  }

  const isDeferred = interaction.deferred;
  const isReplied = interaction.replied;

  // Force ephemeral if not already set
  if (!('flags' in payload)) {
    payload.flags = MessageFlags.Ephemeral;
  }

  try {
    if (DEBUG_TRADE) {
      console.debug(`[safeReply] Using ${isDeferred || isReplied ? 'editReply' : 'reply'}`, payload);
    }

    return isDeferred || isReplied
      ? await interaction.editReply(payload)
      : await interaction.reply(payload);

  } catch (err) {
    console.error('[safeReply] Failed to respond to interaction:', err);
  }
}

const TradeStateCache = {
  get: (userId) => pendingBest.get(userId),
  set: (userId, data) => pendingBest.set(userId, data),
  delete: (userId) => pendingBest.delete(userId),
  clear: () => pendingBest.clear(),
};

module.exports = {
  safeReply,
  pendingBest,
  TradeStateCache,
};
