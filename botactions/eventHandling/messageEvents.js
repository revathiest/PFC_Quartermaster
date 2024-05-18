const { usageLog } = require('../../config/database');
const filter = require('../../messages.json'); // Assumes messages.json contains both words and regex patterns

module.exports = {
    handleMessageCreate: async function(message, client) {
        if (!message.guild || message.author.bot) {
            return;
        }

        // Debug: Check if usageLog is defined
        if (!usageLog) {
            console.error('Error: usageLog is not defined');
            return;
        }

        try {
            // Log the message event to the database
            await usageLog.create({
                user_id: message.author.id,
                event_type: 'message_create',
                event_data: JSON.stringify({ content: message.content, channel_id: message.channel.id }),
            });
            console.log('Message logged successfully');
        } catch (error) {
            console.error('Error logging message:', error);
        }

        // Process the message content
        const content = message.content;
        const words = content.split(' ');
        let allowMessage = true; // Placeholder for any additional conditions to allow message processing

        // Filter based on individual words
        for (const word in filter.words) {
            if (filter.words.hasOwnProperty(word) && words.includes(word) && allowMessage) {
                module.exports.performAction(message, client, filter.words[word]); // Use module.exports to reference performAction
                return; // Stop processing after an action is performed
            }
        }

        // Filter based on regular expressions
        for (const regex in filter.regex) {
            if (filter.regex.hasOwnProperty(regex)) {
                const regexObj = new RegExp(regex, "i"); // Example assumes regex patterns are stored directly and "i" flag for case-insensitivity
                if (regexObj.test(content) && allowMessage) {
                    module.exports.performAction(message, client, filter.regex[regex]); // Use module.exports to reference performAction
                    return; // Stop processing after an action is performed
                }
            }
        }
    },

    performAction: function(message, client, actionDetail) {
        if (actionDetail.action === "respond") {
            message.channel.send(actionDetail.response);
        } else if (actionDetail.action === "delete") {
            const channelName = message.channel.name;
            const username = message.author.username;
            const deletionMessage = `The following message has been deleted from channel ${channelName}. Sender - ${username}`;
            const responseChannel = client.channels.cache.get(client.chanProfanityAlert);
            if (responseChannel && responseChannel.isText()) {
                responseChannel.send(deletionMessage);
                responseChannel.send(message.content);
            }
            message.delete();
        }
        return; // Stop processing after an action is performed
    }
};
