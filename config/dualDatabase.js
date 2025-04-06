// config/dualDatabase.js
const { Sequelize } = require('sequelize');
const config = require('../databaseConfig.json');

const prodConfig = config.production;
const devConfig = config.development;

const prodSequelize = new Sequelize(
  prodConfig.database,
  prodConfig.username,
  prodConfig.password,
  {
    host: prodConfig.host,
    dialect: prodConfig.dialect,
    logging: false
  }
);

const devSequelize = new Sequelize(
  devConfig.database,
  devConfig.username,
  devConfig.password,
  {
    host: devConfig.host,
    dialect: devConfig.dialect,
    logging: false
  }
);

module.exports = { prodSequelize, devSequelize };
