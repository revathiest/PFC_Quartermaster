module.exports = (sequelize, DataTypes) => {
    const UserSettings = sequelize.define('UserSettings', {
      user_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      guild_id: {
        type: DataTypes.STRING,
        allowNull: true
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
  
    UserSettings.removeAttribute('id'); // Removing the default id attribute
  
    UserSettings.addConstraint('unique_user_guild_key', {
      type: 'unique',
      fields: ['user_id', 'guild_id', 'key']
    });
  
    return UserSettings;
  };
  