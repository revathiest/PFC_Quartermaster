const { UsageLog } = require('../../config/database');
const filter = require('../../messages.json'); // Assumes messages.json contains both words and regex patterns

module.exports = {
    handleMessageCreate: async function(message, client) {
        if (!message.guild || message.author.bot) {
            return;
        }

        const serverId = message.guild.id;

        try {
            // Log the message event to the database
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
        // Process the message content
        const content = message.content;
        const lowerCaseContent = content.toLowerCase();
        // Create arrays for personal and regular triggers
        const personalTriggers = [];
        const regularTriggers = [];
        let allowMessage = true; // Placeholder for any additional conditions to allow message processing

        // Split triggers based on their action type
        for (const phrase in filter.words) {
            if (filter.words.hasOwnProperty(phrase)) {
                if (filter.words[phrase].action === "personal") {
                    personalTriggers.push(phrase);
                } else {
                    regularTriggers.push(phrase);
                }
            }
        }

        // Process personal triggers first
        for (const phrase of personalTriggers) {
            if (lowerCaseContent.includes(phrase)) {
                console.log('Checking personal trigger for "' + phrase + '"');
                if (module.exports.performAction(message, client, filter.words[phrase])) {
                    return; // If a personal trigger matched and executed, stop here.
                }
            }
        }
        
        // Then process regular triggers
        for (const phrase of regularTriggers) {
            if (lowerCaseContent.includes(phrase)) {
                console.log('Checking regular trigger for "' + phrase + '"');
                if (module.exports.performAction(message, client, filter.words[phrase])) {
                    return; // Execute the trigger and exit.
                }
            }
        }

        // Filter based on regular expressions
        for (const regex in filter.regex) {
            if (filter.regex.hasOwnProperty(regex)) {
                const regexObj = new RegExp(regex, "i"); // Regex patterns with case-insensitivity
                if (regexObj.test(content) && allowMessage) {
                    console.log('Matched regex: ' + regex);
                    if (module.exports.performAction(message, client, filter.regex[regex])) {
                        return;
                    }
                }
            }
        }
    },

    performAction: function(message, client, actionDetail) {
        // Handle personal actions
        if (actionDetail.action === "personal") {
            console.log(actionDetail.userId)
            console.log(message.author.id)
            console.log(message.author)
            if (actionDetail.userId && message.author.id === actionDetail.userId) {
                message.channel.send(actionDetail.response);
                return true; // Personal action matched, so stop further processing.
            } else if (actionDetail.username && message.author.username.toLowerCase() === actionDetail.username.toLowerCase()) {
                message.channel.send(actionDetail.response);
                return true; // Personal action matched.
            } else {
                console.log("Personal action ignored: User does not match");
                return false; // No match, so allow further triggers.
            }
        }
        // Regular respond action.
        else if (actionDetail.action === "respond") {
            message.channel.send(actionDetail.response);
            return true;
        }
        // Delete action.
        else if (actionDetail.action === "delete") {
            const channelName = message.channel.name;
            const username = message.author.username;
            const deletionMessage = `The following message has been deleted from channel ${channelName}. Sender - ${username}`;
            const responseChannel = client.channels.cache.get(client.chanProfanityAlert);
            if (responseChannel && responseChannel.isText()) {
                responseChannel.send(deletionMessage);
                responseChannel.send(message.content);
            }
            message.delete();
            return true;
        }
        return false;
    }
};
