// models/verifiedUser.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VerifiedUser = sequelize.define('VerifiedUser', {
    discordUserId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    rsiHandle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rsiOrgId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verifiedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'verified_users',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  return VerifiedUser;
};
