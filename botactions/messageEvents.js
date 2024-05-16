const filter = require('./messages.json'); // Assumes messages.json contains both words and regex patterns

module.exports = {
    handleMessageCreate: function(message, client) {
        if (!message.guild || message.author.bot) {
            return;
        }

        // Process the message content
        const content = message.content;
        const words = content.split(' ');
        let allowMessage = true; // Placeholder for any additional conditions to allow message processing

        // Filter based on individual words
        for (var word in filter.words) {
            if (filter.words.hasOwnProperty(word) && words.includes(word) && allowMessage) {
                this.performAction(message, client, filter.words[word]);
            }
        }

        // Filter based on regular expressions
        for (var regex in filter.regex) {
            if (filter.regex.hasOwnProperty(regex)) {
                const regexObj = new RegExp(regex, "i"); // Example assumes regex patterns are stored directly and "i" flag for case-insensitivity
                if (regexObj.test(content) && allowMessage) {
                    this.performAction(message, client, filter.regex[regex]);
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
}
