// models/UexVehicle.js
export default (sequelize, DataTypes) => {
    const UexVehicle = sequelize.define('UexVehicle', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      uuid: DataTypes.UUID,
      name: DataTypes.STRING,
      name_full: DataTypes.STRING,
      slug: DataTypes.STRING,
      company_name: DataTypes.STRING,
      crew: DataTypes.STRING,
      scu: DataTypes.INTEGER,
      mass: DataTypes.INTEGER,
      width: DataTypes.FLOAT,
      height: DataTypes.FLOAT,
      length: DataTypes.FLOAT,
      fuel_quantum: DataTypes.FLOAT,
      fuel_hydrogen: DataTypes.FLOAT,
      container_sizes: DataTypes.STRING,
      pad_type: DataTypes.STRING,
      game_version: DataTypes.STRING,
      date_added: DataTypes.BIGINT,
      date_modified: DataTypes.BIGINT,
      url_store: DataTypes.TEXT,
      url_brochure: DataTypes.TEXT,
      url_hotsite: DataTypes.TEXT,
      url_video: DataTypes.TEXT,
      url_photos: DataTypes.TEXT, // JSON string of photo URLs
  
      // Booleans
      is_spaceship: DataTypes.BOOLEAN,
      is_ground_vehicle: DataTypes.BOOLEAN,
      is_single_pilot: DataTypes.BOOLEAN,
      is_multi_crew: DataTypes.BOOLEAN,
      is_combat: DataTypes.BOOLEAN,
      is_exploration: DataTypes.BOOLEAN,
      is_industry: DataTypes.BOOLEAN,
      is_cargo: DataTypes.BOOLEAN,
      is_refinery: DataTypes.BOOLEAN,
      is_mining: DataTypes.BOOLEAN,
      is_salvage: DataTypes.BOOLEAN,
      is_transport: DataTypes.BOOLEAN,
      is_medical: DataTypes.BOOLEAN,
      is_racing: DataTypes.BOOLEAN,
      is_touring: DataTypes.BOOLEAN,
      is_data: DataTypes.BOOLEAN,
      is_stealth: DataTypes.BOOLEAN,
      is_military: DataTypes.BOOLEAN,
      is_civilian: DataTypes.BOOLEAN,
      is_personal_transport: DataTypes.BOOLEAN,
      is_vehicle_transport: DataTypes.BOOLEAN,
      is_research: DataTypes.BOOLEAN,
      is_pathfinder: DataTypes.BOOLEAN,
      is_multirole: DataTypes.BOOLEAN
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    });
  
    return UexVehicle;
  };
  