const Config = require('../models/configModel');

const saveConfigToDatabase = async (config) => {
  try {
    for (const key in config) {
      await Config.upsert({ key, value: JSON.stringify(config[key]) });
    }
    console.log('Configuration saved to database');
  } catch (error) {
    console.error('Error saving configuration to database:', error);
  }
};

const getConfigFromDatabase = async () => {
  try {
    const configs = await Config.findAll();
    const config = {};
    configs.forEach(c => {
      config[c.key] = JSON.parse(c.value);
    });
    return config;
  } catch (error) {
    console.error('Error retrieving configuration from database:', error);
  }
};

module.exports = {
  saveConfigToDatabase,
  getConfigFromDatabase,
};
