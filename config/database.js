const { Sequelize } = require('sequelize');
const config = require('../databaseConfig.json');  // Adjust the path if needed
const fs = require('fs');
const { saveConfigToDatabase } = require('../botactions/databaseHandler');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging || false,
});

const models = {
  Config: require('../models/configModel')
};

const loadConfig = () => {
  const rawData = fs.readFileSync('../config.json');
  return JSON.parse(rawData);
};

const initializeDatabase = async () => {
  try {
    await sequelize.sync({ force: false });  // Set to true only if you want to drop and recreate tables
    console.log('Database synchronized');

    const config = loadConfig();
    await saveConfigToDatabase(config);

  } catch (error) {
    console.error('Unable to synchronize the database:', error);
  }
};

module.exports = {
  sequelize,
  models,
  initializeDatabase,
};
