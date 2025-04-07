// models/galactapediaTag.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GalactapediaTag = sequelize.define('GalactapediaTag', {
    entry_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    tag_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tag_name: {
      type: DataTypes.STRING,
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

  return GalactapediaTag;
};
