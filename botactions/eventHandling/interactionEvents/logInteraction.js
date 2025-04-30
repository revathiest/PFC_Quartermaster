// eventHandling/interactionEvents/logInteraction.js

const { UsageLog } = require('../../../config/database');
const { buildOptionsSummary } = require('./buildOptionsSummary');

/**
 * Log an interaction into the database and console.
 * @param {object} params
 * @param {Interaction} params.interaction - The Discord interaction object
 * @param {string} params.type - 'command' | 'button' | 'select_menu' | 'modal_submit'
 * @param {string} params.event - Specific event type (e.g., 'command_used')
 * @param {string} params.commandName - The name of the command
 * @param {string} params.serverId - Server (guild) ID
 * @param {string} [params.optionsSummary] - Optional string summary of options
 */
 async function logInteraction(params = {}) {
  try {
    const {
      interaction,
      type,
      event,
      commandName,
      serverId,
      optionsSummary = '',
    } = params;

    const resolvedType = typeof type === 'string' ? type.toLowerCase() : 'unknown';
    const resolvedEvent = typeof event === 'string' ? event.toLowerCase() : 'unknown_event';
    const resolvedCommand = typeof commandName === 'string' ? commandName : 'unknown';
    const resolvedServer = typeof serverId === 'string' ? serverId : 'unknown';
    const userId = interaction?.user?.id ?? 'unknown_user';
    const username = interaction?.user?.globalName || interaction?.user?.username || interaction?.user?.tag || 'unknown_user';

    let channelId = 'unknown_channel';
    let channelName = 'unknown_channel';

    if (interaction?.channel) {
      try {
        const canFetch = typeof interaction.channel.fetch === 'function';
        const channel = canFetch ? await interaction.channel.fetch().catch(() => interaction.channel) : interaction.channel;

        channelId = channel?.id ?? 'unknown_channel';
        channelName = channel?.name ?? (channel?.recipient?.username ?? 'unknown_channel');
      } catch (fetchErr) {
        console.error('❌ Failed to fetch or resolve channel for logging:', fetchErr);
      }
    }

    await UsageLog.create({
      user_id: userId,
      interaction_type: resolvedType,
      event_type: resolvedEvent,
      command_name: resolvedCommand,
      channel_id: channelId,
      server_id: resolvedServer,
      event_time: new Date(),
    });

    let logLine = `✅ [${resolvedType.toUpperCase()} Logged] /${resolvedCommand}`;

    if (interaction?.options && typeof interaction.options.getSubcommand === 'function') {
      const subcommand = interaction.options.getSubcommand(false);
      if (subcommand) logLine += ` ${subcommand}`;
    }

    logLine += ` by ${username} in #${channelName}`;

    if (optionsSummary) {
      logLine += ` with ${optionsSummary}`;
    }

    console.log(logLine);
  } catch (error) {
    const safeType = params?.type ? params.type.toUpperCase() : 'UNKNOWN';
    console.error(`❌ [${safeType} Log Error] Failed to log interaction:`, error);
  }
}


module.exports = {
  logInteraction,
};
