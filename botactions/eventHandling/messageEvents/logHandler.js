//botactions/eventHandling/messageEvents/logHandler.js
const { UsageLog } = require('../../config/database');

module.exports = async function logMessage(message, serverId) {
    try {
        await UsageLog.create({
            user_id: message.author.id,
            interaction_type: 'message',
            event_type: 'message_create',
            message_id: message.id,
            message_content: message.content,
            channel_id: message.channel.id,
            server_id: serverId,
            event_time: new Date(),
        });
        console.log('Message logged successfully');
    } catch (error) {
        console.error('Error logging message:', error);
    }
};