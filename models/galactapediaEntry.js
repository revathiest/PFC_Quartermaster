// models/galactapediaEntry.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GalactapediaEntry = sequelize.define('GalactapediaEntry', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thumbnail: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rsi_url: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    api_url: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  return GalactapediaEntry;
};
