// models/shop.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Shop = sequelize.define('Shop', {
    uuid: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name_raw: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profit_margin: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  return Shop;
};
