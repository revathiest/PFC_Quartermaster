const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = (sequelize) => {
    const SnapChannel = sequelize.define('SnapChannel', {
        channelId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        purgeTimeInDays: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        serverId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastPurgeDate: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW
        }
    });
  
    return SnapChannel;
}
