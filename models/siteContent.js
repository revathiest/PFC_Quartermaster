const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('SiteContent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'SiteContents',
    timestamps: false
  });
};
