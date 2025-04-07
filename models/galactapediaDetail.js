// models/galactapediaDetail.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GalactapediaDetail = sequelize.define('GalactapediaDetail', {
    entry_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  return GalactapediaDetail;
};
