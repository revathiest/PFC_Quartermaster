const { sequelize } = require('../../config/database');
const Config = require('../../models/config')(sequelize);

const saveConfigToDatabase = async (config, botType) => {
  try {
    for (const key in config) {
      await Config.upsert({ key, value: JSON.stringify(config[key]), botType });
    }
    console.log('Configuration saved to database');
  } catch (error) {
    console.error('Error saving configuration to database:', error);
  }
};

const getConfigFromDatabase = async (botType) => {
  try {
    const configs = await Config.findAll({ where: { botType } });
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
