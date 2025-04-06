const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Manufacturer', {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
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
