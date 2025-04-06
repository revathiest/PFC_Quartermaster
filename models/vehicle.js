// models/Vehicle.js
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Vehicle', {
      uuid: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      link: {
        type: DataTypes.STRING(1024),
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      version: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    });
  };
  