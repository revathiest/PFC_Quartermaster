const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

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
