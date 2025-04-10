const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UexVehicle = sequelize.define('UexVehicle', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    uuid: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name_full: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    crew: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    scu: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mass: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    width: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    length: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    fuel_quantum: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    fuel_hydrogen: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    container_sizes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pad_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    game_version: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date_added: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    date_modified: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    url_store: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    url_brochure: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    url_hotsite: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    url_video: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    url_photos: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_spaceship: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_ground_vehicle: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_single_pilot: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_multi_crew: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_combat: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_exploration: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_industry: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_cargo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_refinery: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_mining: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_salvage: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_transport: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_medical: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_racing: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_touring: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_data: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_stealth: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_military: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_civilian: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_personal_transport: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_vehicle_transport: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_research: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_pathfinder: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_multirole: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    }
  }, {
    tableName: 'UexVehicles',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  });

  return UexVehicle;
};
