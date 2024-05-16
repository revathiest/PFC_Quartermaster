module.exports = (sequelize, DataTypes) => {
  const GuildSettings = sequelize.define('GuildSettings', {
    guild_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['guild_id', 'key']
      }
    ]
  });

  GuildSettings.removeAttribute('id'); // Removing the default id attribute

  return GuildSettings;
};
