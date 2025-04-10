const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('UexCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_game_related: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    is_mining: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    date_added: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date_modified: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'UexCategories',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false
  });
};
