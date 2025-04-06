const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Config', {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    botType: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    uniqueKeys: {
      unique_key: {
        fields: ['key', 'botType']
      }
    },
    tableName: 'Configs',        // ✅ explicitly define table name
    timestamps: true             // ✅ include createdAt/updatedAt
  });
}
