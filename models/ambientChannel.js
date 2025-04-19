// models/ambientChannel.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('AmbientChannel', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      guildId: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      channelId: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
    }, {
      indexes: [
        {
          unique: true,
          fields: ['guildId', 'channelId'],
        },
      ],
      tableName: 'ambient_channels',
      timestamps: false,
    });
  };
  