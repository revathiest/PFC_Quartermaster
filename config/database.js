const { Sequelize } = require('sequelize');
const config = require('../databaseConfig.json');  // Adjust the path if needed

const env = process.env.BOT_TYPE || 'development';
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
const GalactapediaEntry = require('../models/galactapediaEntry')(sequelize);
const GalactapediaDetail = require('../models/galactapediaDetail')(sequelize);
const GalactapediaProperty = require('../models/galactapediaProperty')(sequelize);
const GalactapediaRelatedArticle = require('../models/galactapediaRelatedArticle')(sequelize);
const GalactapediaTag = require('../models/galactapediaTag')(sequelize);
const GalactapediaCategory = require('../models/galactapediaCategory')(sequelize);
const UexVehicle = require('../models/uexVehicle')(sequelize);
const UexTerminal = require('../models/uexTerminal')(sequelize);
const UexItemPrice = require('../models/uexItemPrice')(sequelize);
const UexCategory = require('../models/uexCategory')(sequelize);
const UexCommodityPrice = require('../models/uexCommodityPrice')(sequelize);

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
    GalactapediaEntry,
    GalactapediaDetail,
    GalactapediaProperty,
    GalactapediaRelatedArticle,
    GalactapediaTag,
    GalactapediaCategory,
    UexVehicle,
    UexTerminal,
    UexItemPrice,
    UexCategory
};
