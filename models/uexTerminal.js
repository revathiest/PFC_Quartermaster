const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UexTerminal = sequelize.define('UexTerminal', {
    id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    id_star_system: { type: DataTypes.INTEGER, allowNull: true },
    id_planet: { type: DataTypes.INTEGER, allowNull: true },
    id_orbit: { type: DataTypes.INTEGER, allowNull: true },
    id_moon: { type: DataTypes.INTEGER, allowNull: true },
    id_space_station: { type: DataTypes.INTEGER, allowNull: true },
    id_outpost: { type: DataTypes.INTEGER, allowNull: true },
    id_poi: { type: DataTypes.INTEGER, allowNull: true },
    id_city: { type: DataTypes.INTEGER, allowNull: true },
    id_faction: { type: DataTypes.INTEGER, allowNull: true },
    id_company: { type: DataTypes.INTEGER, allowNull: true },

    name: { type: DataTypes.STRING, allowNull: true },
    nickname: { type: DataTypes.STRING, allowNull: true },
    code: { type: DataTypes.STRING, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: true },
    contact_url: { type: DataTypes.STRING, allowNull: true },
    mcs: { type: DataTypes.INTEGER, allowNull: true },

    is_available: { type: DataTypes.BOOLEAN, allowNull: true },
    is_available_live: { type: DataTypes.BOOLEAN, allowNull: true },
    is_visible: { type: DataTypes.BOOLEAN, allowNull: true },
    is_default_system: { type: DataTypes.BOOLEAN, allowNull: true },
    is_affinity_influenceable: { type: DataTypes.BOOLEAN, allowNull: true },
    is_habitation: { type: DataTypes.BOOLEAN, allowNull: true },
    is_refinery: { type: DataTypes.BOOLEAN, allowNull: true },
    is_cargo_center: { type: DataTypes.BOOLEAN, allowNull: true },
    is_medical: { type: DataTypes.BOOLEAN, allowNull: true },
    is_food: { type: DataTypes.BOOLEAN, allowNull: true },
    is_shop_fps: { type: DataTypes.BOOLEAN, allowNull: true },
    is_shop_vehicle: { type: DataTypes.BOOLEAN, allowNull: true },
    is_refuel: { type: DataTypes.BOOLEAN, allowNull: true },
    is_repair: { type: DataTypes.BOOLEAN, allowNull: true },
    is_nqa: { type: DataTypes.BOOLEAN, allowNull: true },
    is_jump_point: { type: DataTypes.BOOLEAN, allowNull: true },
    is_player_owned: { type: DataTypes.BOOLEAN, allowNull: true },
    is_auto_load: { type: DataTypes.BOOLEAN, allowNull: true },

    has_loading_dock: { type: DataTypes.BOOLEAN, allowNull: true },
    has_docking_port: { type: DataTypes.BOOLEAN, allowNull: true },
    has_freight_elevator: { type: DataTypes.BOOLEAN, allowNull: true },

    date_added: { type: DataTypes.BIGINT, allowNull: true },
    date_modified: { type: DataTypes.BIGINT, allowNull: true },

    star_system_name: { type: DataTypes.STRING, allowNull: true },
    planet_name: { type: DataTypes.STRING, allowNull: true },
    orbit_name: { type: DataTypes.STRING, allowNull: true },
    moon_name: { type: DataTypes.STRING, allowNull: true },
    space_station_name: { type: DataTypes.STRING, allowNull: true },
    outpost_name: { type: DataTypes.STRING, allowNull: true },
    city_name: { type: DataTypes.STRING, allowNull: true },

    faction_name: { type: DataTypes.STRING, allowNull: true },
    company_name: { type: DataTypes.STRING, allowNull: true },

    max_container_size: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  });

  UexTerminal.associate = (models) => {
    UexTerminal.belongsTo(models.UexPoi, { foreignKey: 'id_poi', as: 'poi' });
  };

  return UexTerminal;
};
