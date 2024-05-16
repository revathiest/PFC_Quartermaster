const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Read database configuration from the JSON file
const configPath = path.join(__dirname, '../databaseConfig.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect
});

// Define models
const Transaction = sequelize.define('Transaction', {
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

const Configuration = sequelize.define('Configuration', {
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = {
    sequelize,
    Transaction,
    Configuration
};
