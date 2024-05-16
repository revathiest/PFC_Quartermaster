module.exports = (sequelize, DataTypes) => {
    const BotSettings = sequelize.define('BotSettings', {
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    });
  
    return BotSettings;
  };
  