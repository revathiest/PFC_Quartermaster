// models/galactapediaRelatedArticle.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GalactapediaRelatedArticle = sequelize.define('GalactapediaRelatedArticle', {
    entry_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    related_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    api_url: {
      type: DataTypes.STRING(1000),
      allowNull: true
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
