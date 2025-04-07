// models/galactapediaCategory.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GalactapediaCategory = sequelize.define('GalactapediaCategory', {
    entry_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category_name: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  return GalactapediaCategory;
};
