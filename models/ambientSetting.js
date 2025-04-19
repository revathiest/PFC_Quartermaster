const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('AmbientSetting', {
      guildId: {
        type: DataTypes.STRING(32),
        primaryKey: true
      },
      minMessagesSinceLast: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5
      },
      freshWindowMs: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3 * 60 * 1000 // 3 minutes
      }
    }, {
      tableName: 'ambient_settings',
      timestamps: false
    });
  };
  