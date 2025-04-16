const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Accolade', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emoji: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    message_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    channel_id: {
      type: DataTypes.STRING,
      allowNull: true
    },  
    date_added: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date_modified: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    tableName: 'Accolades',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false
  });
};
