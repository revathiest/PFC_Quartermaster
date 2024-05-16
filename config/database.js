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

module.exports = {
    sequelize,
    Transaction,
    Configuration
};
