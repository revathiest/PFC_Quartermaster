const fs = require('fs');

module.exports = {
  countbasedchatter: function(client) {
    fs.readFile('./variables.json', 'utf8', function(err, data) {
      if (err) {
        console.log(err);
        return;
      }

      try {
        const jsonData = JSON.parse(data);
        const messageCounts = jsonData.messagecount;

        Object.keys(messageCounts).forEach(channelId => {
          const messageCount = messageCounts[channelId];
          if (messageCount >= 3000) {
            fs.readFile('./countBasedChatter.json', 'utf8', function(err, data) {
              if (err) {
                console.log(err);
                return;
              }

              try {
                const statements = JSON.parse(data);
                const randomStatementKey = getRandomStatementKey(statements);
                const randomStatement = statements[randomStatementKey];
                const channel = client.channels.cache.get(channelId);

                if (channel && channel.send) {
                  channel.send(randomStatement).then(() => {
                    messageCounts[channelId] = 0; // Reset the message count

                    fs.writeFile('./variables.json', JSON.stringify(jsonData, null, 2), 'utf8', function(err) {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log('Message sent and message count reset for channel:', channelId);
                      }
                    });
                  }).catch(err => {
                    console.log('Error sending message:', err);
                  });
                }
              } catch (error) {
                console.log(error);
              }
            });
          }
        });
      } catch (error) {
        console.log(error);
      }
    });
  },
};

function getRandomStatementKey(statements) {
  const keys = Object.keys(statements);
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
}
