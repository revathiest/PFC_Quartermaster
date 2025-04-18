// models/orgTag.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrgTag = sequelize.define('OrgTag', {
    rsiOrgId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'org_tags',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  return OrgTag;
};
