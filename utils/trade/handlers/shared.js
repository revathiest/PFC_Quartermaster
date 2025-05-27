const pendingBest = new Map();

const { MessageFlags } = require('discord.js');

async function safeReply(interaction, payload = {}) {
  if (!interaction || typeof interaction.reply !== 'function') {
    console.error('[safeReply] Invalid interaction object:', interaction);
    return;
  }

  if (typeof payload === 'string') {
    payload = { content: payload };
  }

  // Always enforce ephemeral visibility
  payload.flags = MessageFlags.Ephemeral;

  try {
    if (interaction.replied || interaction.deferred) {
      // 🧼 Clear out old embeds/components if not explicitly provided
      const patch = {
        ...payload,
        embeds: payload.embeds ?? [],
        components: payload.components ?? []
      };
      return await interaction.editReply(patch);
    } else {
      return await interaction.reply(payload);
    }
  } catch (err) {
    console.error('[safeReply] Failed to respond to interaction', err);
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
