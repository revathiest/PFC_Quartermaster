const { Sequelize } = require('sequelize');
const config = require('./databaseConfig.json');

// Get the environment or default to 'development'
const env = process.env.BOT_TYPE || 'development';
const dbConfig = config[env];

if (!dbConfig) {
  throw new Error(`No database configuration found for environment: ${env}`);
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false,
  }
);

module.exports = { sequelize };
