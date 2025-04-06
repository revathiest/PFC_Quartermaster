const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Manufacturer', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    link: {
      type: DataTypes.STRING(1024),
      allowNull: true
    }
  }, {
    tableName: 'Manufacturers',
    timestamps: false
  });
};
