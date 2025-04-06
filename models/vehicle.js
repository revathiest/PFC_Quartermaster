const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Vehicle = sequelize.define('Vehicle', {
  uuid: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: DataTypes.STRING,
  link: DataTypes.STRING(1024),
  version: DataTypes.STRING,
  updated_at: DataTypes.DATE
}, {
  tableName: 'Vehicles',
  timestamps: false
});

module.exports = Vehicle;
