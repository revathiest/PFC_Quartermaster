const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Manufacturer', {
    code: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'Manufacturers',
    timestamps: false
  });
};
