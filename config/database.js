const { Sequelize, DataTypes } = require('sequelize');
const config = require('../databaseConfig.json');  // Adjust the path if needed

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging || false,
});

// Define models
const BotSettings = require('../models/bot_settings')(sequelize, DataTypes);
const GuildSettings = require('../models/guild_settings')(sequelize, DataTypes);
const UserSettings = require('../models/user_settings')(sequelize, DataTypes);
const CommandPermissions = require('../models/command_permissions')(sequelize, DataTypes);

// Export models and sequelize instance
const models = {
  BotSettings,
  GuildSettings,
  UserSettings,
  CommandPermissions,
};

const initializeDatabase = async () => {
  try {
    await sequelize.sync({ force: false });  // Set to true only if you want to drop and recreate tables
    console.log('Database synchronized');
  } catch (error) {
    console.error('Unable to synchronize the database:', error);
  }
};

module.exports = {
  sequelize,
  models,
  initializeDatabase,
};
