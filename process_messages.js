const filter = require('./messages.json');

module.exports = {
    process_messages: function(message, allowmessage) {
      const content = message.content.toLowerCase();

      // Filter regular expressions
      for (var regex in filter.regex) {
        if (filter.regex.hasOwnProperty(regex)) {
          const regexStr = regex.slice(1, -1);
          const regexObj = new RegExp(regexStr, "i"); // Use "i" flag for case-insensitive matching
          if (regexObj.test(content) && allowmessage) {
            const action = filter.regex[regex].action;
            if (action === "respond") {
              message.channel.send(filter.regex[regex].response);
            } else if (action === "delete") {
                const response = filter.regex[regex].response;
                const channelID = "907426072700801094"; // Replace with the actual channel ID
                const channel = message.client.channels.cache.get(channelID);
                if (channel && channel.type == 0) {
                  channel.send(response);
                }
              message.delete();
            }
            return false;
          }
        }
      }
  
      // Filter individual words
      const words = content.split(' ');
      for (var word in filter.words) {
        if (filter.words.hasOwnProperty(word)) {
          if (words.includes(word) && allowmessage) {
            const action = filter.words[word].action;
            if (action === "respond") {
              message.channel.send(filter.words[word].response);
            } else if (action === "delete") {
              message.delete();
            }
            return false;
          }
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
  