// models/galactapediaTag.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GalactapediaTag = sequelize.define('GalactapediaTag', {
    entry_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tag_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tag_name: {
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

  return GalactapediaTag;
};
