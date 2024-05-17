const fs = require('fs');
const { getConfigFromDatabase, saveConfigToDatabase } = require('./databaseHandler');

const loadConfigFromFile = () => {
  console.log('Loading configuration from file...');
  const rawData = fs.readFileSync('./config.json');
  const configFile = JSON.parse(rawData);
  console.log('Configuration successfully loaded from file');
  return configFile;
};

const loadConfiguration = async (botType) => {
  let config;
  try {
    console.log('Attempting to load configuration from database...');
    config = await getConfigFromDatabase(botType);
    if (Object.keys(config).length === 0) {
      console.log('No configuration found in database, loading from file...');
      config = loadConfigFromFile();
      await saveConfigToDatabase(config, botType);
    } else {
      console.log('Configuration successfully loaded from database');
    }
  } catch (error) {
    console.error('Error loading configuration from database, falling back to file...');
    config = loadConfigFromFile();
    await saveConfigToDatabase(config, botType);
  }
  return config;
};

module.exports = {
  loadConfigFromFile,
  loadConfiguration
};
