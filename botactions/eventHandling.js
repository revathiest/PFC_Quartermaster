const interactionHandler = require('./eventHandling/interactionEvents');
const { handleMessageCreate, handleMessageDelete, handleMessageUpdate } = require('./eventHandling/messageEvents');
const { handleReactionAdd, handleReactionRemove } = require('./eventHandling/reactionEvents');
const { handleVoiceStateUpdate } = require('./eventHandling/voiceEvents');
const { handleGuildMemberRemove, handleGuildBanAdd, handleGuildMemberUpdate } = require('./eventHandling/moderationEvents');

module.exports = {
    interactionHandler,
    handleMessageCreate,
    handleMessageDelete,
    handleMessageUpdate,
    handleReactionAdd,
    handleReactionRemove,
    handleVoiceStateUpdate,
    handleGuildMemberRemove,
    handleGuildBanAdd,
    handleGuildMemberUpdate
}