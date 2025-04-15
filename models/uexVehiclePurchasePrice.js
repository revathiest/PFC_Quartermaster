const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UexVehiclePurchasePrice = sequelize.define('UexVehiclePurchasePrice', {
    id: { type: DataTypes.INTEGER, primaryKey: true },

    id_vehicle: { type: DataTypes.INTEGER, allowNull: true },
    id_terminal: { type: DataTypes.INTEGER, allowNull: true },

    price_buy: { type: DataTypes.INTEGER, allowNull: true },

    date_added: { type: DataTypes.INTEGER, allowNull: true },
    date_modified: { type: DataTypes.INTEGER, allowNull: true },

    vehicle_name: { type: DataTypes.STRING, allowNull: true },
    terminal_name: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'UexVehiclePurchasePrices',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false
  });
  
  UexVehiclePurchasePrice.associate = (models) => {
    UexVehiclePurchasePrice.belongsTo(models.UexTerminal, {
      foreignKey: 'id_terminal',
      as: 'terminal'
    });
  };

  return UexVehiclePurchasePrice
};
