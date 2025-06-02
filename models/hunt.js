const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Hunt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discord_event_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'active', 'archived'),
      allowNull: false
    }
  }, {
    tableName: 'hunts',
    timestamps: true
  });
};
