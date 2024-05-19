const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Config = sequelize.define('Config', {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  botType: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  uniqueKeys: {
    unique_key: {
      fields: ['key', 'botType']
    }
  }
});

module.exports = Config;
