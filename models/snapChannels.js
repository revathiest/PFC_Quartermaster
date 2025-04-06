const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('SnapChannel', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
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
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'SnapChannels',
        timestamps: true
    });
};
