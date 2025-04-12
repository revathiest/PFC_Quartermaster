const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UexPoi = sequelize.define('UexPoi', {
    id: { type: DataTypes.INTEGER, primaryKey: true },

    id_star_system: { type: DataTypes.INTEGER, allowNull: true },
    id_planet: { type: DataTypes.INTEGER, allowNull: true },
    id_orbit: { type: DataTypes.INTEGER, allowNull: true },
    id_moon: { type: DataTypes.INTEGER, allowNull: true },
    id_space_station: { type: DataTypes.INTEGER, allowNull: true },
    id_city: { type: DataTypes.INTEGER, allowNull: true },
    id_outpost: { type: DataTypes.INTEGER, allowNull: true },
    id_faction: { type: DataTypes.INTEGER, allowNull: true },
    id_jurisdiction: { type: DataTypes.INTEGER, allowNull: true },

    name: { type: DataTypes.STRING, allowNull: true },
    nickname: { type: DataTypes.STRING, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: true },
    subtype: { type: DataTypes.STRING, allowNull: true },

    is_available: { type: DataTypes.BOOLEAN, allowNull: true },
    is_available_live: { type: DataTypes.BOOLEAN, allowNull: true },
    is_visible: { type: DataTypes.BOOLEAN, allowNull: true },
    is_default: { type: DataTypes.BOOLEAN, allowNull: true },
    is_monitored: { type: DataTypes.BOOLEAN, allowNull: true },
    is_armistice: { type: DataTypes.BOOLEAN, allowNull: true },
    is_landable: { type: DataTypes.BOOLEAN, allowNull: true },
    is_decommissioned: { type: DataTypes.BOOLEAN, allowNull: true },

    has_quantum_marker: { type: DataTypes.BOOLEAN, allowNull: true },
    has_trade_terminal: { type: DataTypes.BOOLEAN, allowNull: true },
    has_habitation: { type: DataTypes.BOOLEAN, allowNull: true },
    has_refinery: { type: DataTypes.BOOLEAN, allowNull: true },
    has_cargo_center: { type: DataTypes.BOOLEAN, allowNull: true },
    has_clinic: { type: DataTypes.BOOLEAN, allowNull: true },
    has_food: { type: DataTypes.BOOLEAN, allowNull: true },
    has_shops: { type: DataTypes.BOOLEAN, allowNull: true },
    has_refuel: { type: DataTypes.BOOLEAN, allowNull: true },
    has_repair: { type: DataTypes.BOOLEAN, allowNull: true },
    has_gravity: { type: DataTypes.BOOLEAN, allowNull: true },
    has_loading_dock: { type: DataTypes.BOOLEAN, allowNull: true },
    has_docking_port: { type: DataTypes.BOOLEAN, allowNull: true },
    has_freight_elevator: { type: DataTypes.BOOLEAN, allowNull: true },

    pad_types: { type: DataTypes.STRING, allowNull: true },

    date_added: { type: DataTypes.INTEGER, allowNull: true },
    date_modified: { type: DataTypes.INTEGER, allowNull: true },

    star_system_name: { type: DataTypes.STRING, allowNull: true },
    planet_name: { type: DataTypes.STRING, allowNull: true },
    orbit_name: { type: DataTypes.STRING, allowNull: true },
    moon_name: { type: DataTypes.STRING, allowNull: true },
    space_station_name: { type: DataTypes.STRING, allowNull: true },
    outpost_name: { type: DataTypes.STRING, allowNull: true },
    city_name: { type: DataTypes.STRING, allowNull: true },
    faction_name: { type: DataTypes.STRING, allowNull: true },
    jurisdiction_name: { type: DataTypes.STRING, allowNull: true }

  }, {
    tableName: 'UexPois',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false
  });

  UexPoi.associate = (models) => {
    // Placeholder in case you later want relationships like:
    // UexPoi.belongsTo(models.UexTerminal, { foreignKey: 'some_id', as: 'terminal' });
  };

  return UexPoi;
};
