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
  }, {
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'guild_id', 'key']
      }
    ]
  });

  UserSettings.removeAttribute('id'); // Removing the default id attribute

  return UserSettings;
};
