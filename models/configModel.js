// models/configModel.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');  // Ensure sequelize is imported correctly

const Config = sequelize.define('Config', {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

module.exports = Config;
