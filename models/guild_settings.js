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
    });
  
    GuildSettings.removeAttribute('id'); // Removing the default id attribute
  
    GuildSettings.addConstraint('unique_guild_key', {
      type: 'unique',
      fields: ['guild_id', 'key']
    });
  
    return GuildSettings;
  };
  