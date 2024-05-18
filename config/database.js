const { Sequelize } = require('sequelize');
const config = require('../databaseConfig.json');  // Adjust the path if needed

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging || false,
});

let useageLog
let voiceLog

const initializeDatabase = async () => {
  try {
    // Import models here to ensure they are defined before syncing
    require('../models/configModel');
    require('../models/scheduledAnnouncementModel');
    useageLog = require('../models/usageLog');
    voiceLog = require('../models/voiceLog');
    
    await sequelize.sync({ force: false });  // Set to true only if you want to drop and recreate tables
    console.log('Database synchronized');
  } catch (error) {
    console.error('Unable to synchronize the database:', error);
  }
};

module.exports = {
  sequelize,
  initializeDatabase,
  usageLog,
  voiceLog
};
