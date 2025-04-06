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
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    link: {
      type: DataTypes.STRING(1024),
      allowNull: false
    }
  }, {
    tableName: 'Manufacturers',
    timestamps: false
  });
};
