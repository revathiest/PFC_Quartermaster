const filter = require('./messages.json');

module.exports = {
    process_messages: function(message, allowmessage) {
        const words = message.content.split(' ');

        for (var i = 0; i < words.length; i++) {
            var tmp = words[i].toLowerCase();
            if (filter[tmp] && allowmessage) {
                message.channel.send(filter[tmp]);
                return false;
            }
        }

        if (message.author.bot == false) {
            return true;
        } else {
            return false;
        }
    },

    test_message: function(string) {
        // This isn't being used.
    },
};
