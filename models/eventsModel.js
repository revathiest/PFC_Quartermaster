const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Event = sequelize.define('Event', {
        event_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        server_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: false
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: false
        },
        event_coordinator: {
            type: DataTypes.STRING,
            allowNull: true
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        timestamps: false,
        tableName: 'Events'
    });

    return Event;
};
