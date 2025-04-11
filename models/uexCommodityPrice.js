const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UexCommodityPrice = sequelize.define('UexCommodityPrice', {
    id: { type: DataTypes.INTEGER, primaryKey: true },

    id_commodity: { type: DataTypes.INTEGER, allowNull: true },
    id_terminal: { type: DataTypes.INTEGER, allowNull: true },

    price_buy: { type: DataTypes.INTEGER, allowNull: true },
    price_buy_avg: { type: DataTypes.INTEGER, allowNull: true },
    price_sell: { type: DataTypes.INTEGER, allowNull: true },
    price_sell_avg: { type: DataTypes.INTEGER, allowNull: true },

    scu_buy: { type: DataTypes.INTEGER, allowNull: true },
    scu_buy_avg: { type: DataTypes.INTEGER, allowNull: true },
    scu_sell_stock: { type: DataTypes.INTEGER, allowNull: true },
    scu_sell_stock_avg: { type: DataTypes.INTEGER, allowNull: true },
    scu_sell: { type: DataTypes.INTEGER, allowNull: true },
    scu_sell_avg: { type: DataTypes.INTEGER, allowNull: true },

    status_buy: { type: DataTypes.INTEGER, allowNull: true },
    status_sell: { type: DataTypes.INTEGER, allowNull: true },

    container_sizes: { type: DataTypes.STRING, allowNull: true },

    date_added: { type: DataTypes.INTEGER, allowNull: true },
    date_modified: { type: DataTypes.INTEGER, allowNull: true },

    commodity_name: { type: DataTypes.STRING, allowNull: true },
    terminal_name: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'UexCommodityPrices',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false
  });

  UexCommodityPrice.associate = (models) => {
    UexCommodityPrice.belongsTo(models.UexTerminal, {
      foreignKey: 'id_terminal',
      as: 'terminal'
    });
  };  
  
  UexCommodityPrice.associate = (models) => {
    UexCommodityPrice.belongsTo(models.UexTerminal, {
      foreignKey: 'id_terminal',
      as: 'terminal'
    });
  };

  return UexCommodityPrice;
};
