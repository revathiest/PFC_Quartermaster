const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OfficerBio = sequelize.define('OfficerBio', {
    discordUserId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'officer_bios',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  });

  return OfficerBio;
};
