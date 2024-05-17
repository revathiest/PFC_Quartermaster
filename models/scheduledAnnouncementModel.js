const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ScheduledAnnouncement = sequelize.define('ScheduledAnnouncement', {
    channelId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    time: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

module.exports = ScheduledAnnouncement;
