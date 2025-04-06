const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Manufacturer', {
    uuid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    logo: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'Manufacturers',
    timestamps: false
  });
};
