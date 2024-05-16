module.exports = (sequelize, DataTypes) => {
  const CommandPermissions = sequelize.define('CommandPermissions', {
    guild_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    command: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role_id: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['guild_id', 'command', 'role_id']
      }
    ]
  });

  CommandPermissions.removeAttribute('id'); // Removing the default id attribute

  return CommandPermissions;
};
