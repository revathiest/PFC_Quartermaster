const filter = require('./messages.json');

module.exports = {
    process_messages: function(message, allowmessage, responseChannelID) {
      const content = message.content.toLowerCase();
  
      if (message.author.bot == true) {
        return false;
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
              const channelName = message.channel.name;
              const username = message.author.username;
              const deletionMessage = `The following message has been deleted from channel ${channelName}. Sender - ${username}`;
              const responseChannel = message.client.channels.cache.get(responseChannelID);
              if (responseChannel && responseChannel.isText()) {
                responseChannel.send(deletionMessage);
                responseChannel.send(message.content);
              }
              message.delete();
            }
            return false;
          }
        }
      }
  
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
              const channelName = message.channel.name;
              const username = message.author.username;
              const deletionMessage = `The following message has been deleted from channel ${channelName}. Sender - ${username}`;
              const responseChannel = message.client.channels.cache.get(responseChannelID);
              if (responseChannel && responseChannel.type == 0) {
                responseChannel.send(deletionMessage);
                responseChannel.send(message.content);
              }
              message.delete();
            }
            return false;
          }
        }
      }
    },
  
    test_message: function(string) {
      // This isn't being used.
    },
  };
  