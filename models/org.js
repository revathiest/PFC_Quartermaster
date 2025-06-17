const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Org = sequelize.define('Org', {
    rsiOrgId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'orgs',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  });

  return Org;
};
