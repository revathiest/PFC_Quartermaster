const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('UexCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    section: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_game_related: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    is_mining: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    date_added: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    date_modified: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'UexCategories',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false
  });
};
