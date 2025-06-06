const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('UexVehicleRentalPrice', {
    id: { type: DataTypes.INTEGER, primaryKey: true },

    id_vehicle: { type: DataTypes.INTEGER, allowNull: true },
    id_terminal: { type: DataTypes.INTEGER, allowNull: true },

    price_rent: { type: DataTypes.INTEGER, allowNull: true },

    date_added: { type: DataTypes.INTEGER, allowNull: true },
    date_modified: { type: DataTypes.INTEGER, allowNull: true },

    vehicle_name: { type: DataTypes.STRING, allowNull: true },
    terminal_name: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'UexVehicleRentalPrices',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false
  });
};
