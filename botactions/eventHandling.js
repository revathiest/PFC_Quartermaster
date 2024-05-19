const interactionHandler = require('./eventHandling/interactionEvents');
const { handleMessageCreate } = require('./eventHandling/messageEvents');
const { handleReactionAdd, handleReactionRemove } = require('./eventHandling/reactionEvents');
const { handleVoiceStateUpdate } = require('./eventHandling/voiceEvents');

module.exports = {
    interactionHandler,
    handleMessageCreate,
    handleReactionAdd,
    handleReactionRemove,
    handleVoiceStateUpdate,
}