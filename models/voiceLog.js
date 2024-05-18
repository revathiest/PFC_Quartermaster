const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const VoiceLog = sequelize.define('VoiceLog', {
        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        event_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        event_data: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    });

    return VoiceLog;
};
