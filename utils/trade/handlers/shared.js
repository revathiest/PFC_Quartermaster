const DEBUG_TRADE = false;

const pendingBest = new Map();

async function safeReply(interaction, payload) {
  if (!interaction || typeof interaction.reply !== 'function') {
    console.error('[safeReply] Invalid interaction object:', interaction);
    return;
  }

  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.editReply(payload);
    } else {
      return await interaction.reply(payload);
    }
  } catch (err) {
    console.error(`[safeReply] Failed to respond to interaction`, err);
  }
}

const TradeStateCache = {
  get: (userId) => pendingBest.get(userId),
  set: (userId, data) => pendingBest.set(userId, data),
  delete: (userId) => pendingBest.delete(userId),
  clear: () => pendingBest.clear()
};

module.exports = {
  safeReply,
  pendingBest,
  TradeStateCache
};