const { Sequelize } = require('sequelize');
const config = require('../databaseConfig.json');  // Adjust the path if needed

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging || false,
});

// Import models after initializing sequelize
const UsageLog = require('../models/usageLog')(sequelize);
const VoiceLog = require('../models/voiceLog')(sequelize);
const SnapChannel = require('../models/snapChannels')(sequelize);
const Event = require('../models/eventsModel')(sequelize);
const Config = require('../models/config')(sequelize);
const ScheduledAnnouncement = require('../models/scheduledAnnouncement')(sequelize);
const Manufacturer = require('../models/manufacturer')(sequelize);
const Vehicle = require('../models/vehicle')(sequelize);
const VehicleDetail = require('../models/vehicleDetail')(sequelize);
const Shop = require('../models/shop')(sequelize);

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
    initializeDatabase,
    UsageLog,
    VoiceLog,
    SnapChannel,
    Event,
    Config,
    ScheduledAnnouncement,
    Manufacturer,
    Vehicle,
    VehicleDetail,
    Shop
};
