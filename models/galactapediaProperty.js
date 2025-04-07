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
      allowNull: true
    },
    value: {
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

  return GalactapediaProperty;
};
