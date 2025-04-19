// models/ambientMessage.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AmbientMessage = sequelize.define('AmbientMessage', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        tag: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'ambient_messages',
        timestamps: true
    });

    return AmbientMessage;
};
