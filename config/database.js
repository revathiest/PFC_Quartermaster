const { Sequelize } = require('sequelize');
const config = require('../databaseConfig.json');  // Adjust the path if needed

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging || false,
});

// Import models
const UsageLog = require('../models/usageLog');
const VoiceLog = require('../models/voiceLog');

const initializeDatabase = async () => {
    try {
        // Import other models if necessary
        require('../models/configModel');
        require('../models/scheduledAnnouncementModel');
        
        await sequelize.sync({ force: false });  // Set to true only if you want to drop and recreate tables
        console.log('Database synchronized');
    } catch (error) {
        console.error('Unable to synchronize the database:', error);
    }
};

module.exports = {
    sequelize,
    initializeDatabase,
    UsageLog,
    VoiceLog
};
