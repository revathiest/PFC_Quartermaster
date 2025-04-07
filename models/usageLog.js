const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UsageLog = sequelize.define('UsageLog', {
        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        interaction_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        event_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        message_content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        channel_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        command_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        reaction_type: {
            type: DataTypes.STRING,
            allowNull: true,
            charset: 'utf8mb4', // Ensures the field can store emojis
        },
        device_info: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        event_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        server_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    },{
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
      );

    return UsageLog;
};
