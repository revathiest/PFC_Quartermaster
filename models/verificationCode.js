// models/verificationCode.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VerificationCode = sequelize.define('VerificationCode', {
    discordUserId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'verification_codes',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  return VerificationCode;
};
