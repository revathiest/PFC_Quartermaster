//botactions/eventHandling/messageEvents.js

const path = require('path');

const handleOpenAI = require('./messageEvents/openaiHandler');
const handleFiltering = require('./messageEvents/filterHandler');
const logMessage = require('./messageEvents/logHandler');

module.exports = {
    handleMessageCreate: async (message, client) => {
        if (!message.guild || message.author.bot) return;

        const serverId = message.guild.id;

        if (message.mentions.has(client.user)) {
            return handleOpenAI(message, client);
        }

        await logMessage(message, serverId);
        await handleFiltering(message, client);
    }
};