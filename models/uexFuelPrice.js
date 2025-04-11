const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('UexFuelPrice', {
    id: { type: DataTypes.INTEGER, primaryKey: true },

    id_commodity: { type: DataTypes.INTEGER, allowNull: true },
    id_terminal: { type: DataTypes.INTEGER, allowNull: true },

    price_buy: { type: DataTypes.INTEGER, allowNull: true },
    price_buy_avg: { type: DataTypes.FLOAT, allowNull: true },

    date_added: { type: DataTypes.INTEGER, allowNull: true },
    date_modified: { type: DataTypes.INTEGER, allowNull: true },

    commodity_name: { type: DataTypes.STRING, allowNull: true },
    terminal_name: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'UexFuelPrices',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false
  });
};
