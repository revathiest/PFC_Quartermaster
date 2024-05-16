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
    });
  
    CommandPermissions.removeAttribute('id'); // Removing the default id attribute
  
    CommandPermissions.addConstraint('unique_guild_command_role', {
      type: 'unique',
      fields: ['guild_id', 'command', 'role_id']
    });
  
    return CommandPermissions;
  };
  