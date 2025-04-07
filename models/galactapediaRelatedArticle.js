// models/galactapediaRelatedArticle.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GalactapediaRelatedArticle = sequelize.define('GalactapediaRelatedArticle', {
    entry_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    related_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: false
    },
    api_url: {
      type: DataTypes.STRING(1000),
      allowNull: false
    }
  }, {
    indexes: [
      {
        unique: false,
        fields: ['entry_id']
      }
    ],
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  return GalactapediaRelatedArticle;
};
