// utils/devDataSync.js
const { prodSequelize, devSequelize } = require('../config/dualDatabase');

// Define the model manually since we aren't importing the shared model file
const SnapChannelModel = (sequelize) => sequelize.define('SnapChannel', {
    id: {
      type: require('sequelize').INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    channelId: {
      type: require('sequelize').STRING,
      allowNull: false,
      unique: true
    },
    purgeTimeInDays: {
      type: require('sequelize').INTEGER,
      allowNull: false
    },
    serverId: {
      type: require('sequelize').STRING,
      allowNull: false
    },
    lastPurgeDate: {
      type: require('sequelize').DATE,
      defaultValue: require('sequelize').NOW
    }
  }, {
    tableName: 'snapchannels',
    timestamps: false
  });
  

async function syncSnapChannelsFromProd() {
  console.log('[DEV SYNC] Entered syncSnapChannelsFromProd()');
  const ProdSnapChannel = SnapChannelModel(prodSequelize);
  const DevSnapChannel = SnapChannelModel(devSequelize);

  await prodSequelize.sync();
  await devSequelize.sync();

  console.log('[DEV SYNC] Fetching production data...');
  const prodData = await ProdSnapChannel.findAll({ raw: true });
  console.log(`[DEV SYNC] Got ${prodData.length} records from production.`);
  
  console.log('[DEV SYNC] Fetching development data...');
  const devData = await DevSnapChannel.findAll({ raw: true });
  console.log(`[DEV SYNC] Got ${devData.length} records from development.`);

  const devKeys = new Set(devData.map(d => `${d.serverId}:${d.channelId}`));
  console.log(`[DEV SYNC] Comparing keys...`);
  const toInsert = prodData.filter(row => {
    const key = `${row.serverId}:${row.channelId}`;
    return !devKeys.has(key);
  });
  console.log(`[DEV SYNC] ${toInsert.length} records need to be inserted.`);

  if (toInsert.length > 0) {
    await DevSnapChannel.bulkCreate(toInsert);
    console.log(`Synced ${toInsert.length} SnapChannels from production to dev.`);
  } else {
    console.log('No new SnapChannels to sync.');
  }
}

module.exports = { syncSnapChannelsFromProd };
