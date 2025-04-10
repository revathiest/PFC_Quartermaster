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
      allowNull: false,
    },
    id_terminal: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_buy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_sell: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date_added: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date_modified: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    item_uuid: {
      type: DataTypes.UUID,
      allowNull: true, // explicitly allow null for entries missing UUIDs
    },
    terminal_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'UexItemPrices',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false,
  });

  return UexItemPrice;
};
