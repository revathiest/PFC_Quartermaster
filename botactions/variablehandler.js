const fs = require('fs');

module.exports = {
  getvariable: function(client, key, callback) {
    fs.readFile('./variables.json', 'utf8', function(err, data) {
      if (err) {
        console.log(err);
        return callback(undefined);
      }
      console.log("Variables read.")
      try {
        console.log("Attempting to parse variable json")
        const variables = JSON.parse(data);
        console.log("Successfully parsed variables json")
        const value = variables[key];
        console.log("Messagecounts object initialized")
        return callback(value);
      } catch (error) {
        console.log(error);
        return callback(undefined);
      }
    });
  },

  setvariable: function(client, key, value) {
      let variables = {};
      variables[key] = value;

      fs.writeFile('./variables.json', JSON.stringify(variables, null, 2), 'utf8', function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Variable updated:', key);
        }
      });
  },
};
