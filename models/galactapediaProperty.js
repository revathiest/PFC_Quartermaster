// models/galactapediaProperty.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GalactapediaProperty = sequelize.define('GalactapediaProperty', {
    entry_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    indexes: [
      {
        unique: false,
        fields: ['article_id']
      }
    ],
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  return GalactapediaProperty;
};
