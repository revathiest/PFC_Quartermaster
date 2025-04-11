const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UexItemPrice = sequelize.define('UexItemPrice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    id_item: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_category: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_terminal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    price_buy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    price_sell: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date_added: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date_modified: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    item_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    item_uuid: {
      type: DataTypes.UUID,
      allowNull: true, // explicitly allow null for entries missing UUIDs
    },
    terminal_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'UexItemPrices',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false,
  });
  
  UexItemPrice.associate = (models) => {
    UexItemPrice.belongsTo(models.UexTerminal, {
      foreignKey: 'id_terminal',
      as: 'terminal'
    });
  };

  return UexItemPrice;
};
