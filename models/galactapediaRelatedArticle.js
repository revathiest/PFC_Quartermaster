// models/galactapediaRelatedArticle.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GalactapediaRelatedArticle = sequelize.define('GalactapediaRelatedArticle', {
    article_id: {
      type: DataTypes.STRING,
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
        fields: ['article_id']
      }
    ],
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  return GalactapediaRelatedArticle;
};
