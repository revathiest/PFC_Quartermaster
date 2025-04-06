// utils/devDataSync.js
const { prodSequelize, devSequelize } = require('../config/dualDatabase');

// Define the model manually since we aren't importing the shared model file
const SnapChannelModel = (sequelize) => sequelize.define('SnapChannel', {
  guildId: {
    type: require('sequelize').STRING,
    primaryKey: true,
  },
  channelId: {
    type: require('sequelize').STRING,
    primaryKey: true,
  },
}, {
  tableName: 'snapchannels',
  timestamps: false
});

async function syncSnapChannelsFromProd() {
  const ProdSnapChannel = SnapChannelModel(prodSequelize);
  const DevSnapChannel = SnapChannelModel(devSequelize);

  await prodSequelize.sync();
  await devSequelize.sync();

  const prodData = await ProdSnapChannel.findAll({ raw: true });
  const devData = await DevSnapChannel.findAll({ raw: true });

  const devKeys = new Set(devData.map(d => `${d.guildId}:${d.channelId}`));

  const toInsert = prodData.filter(row => {
    const key = `${row.guildId}:${row.channelId}`;
    return !devKeys.has(key);
  });

  if (toInsert.length > 0) {
    await DevSnapChannel.bulkCreate(toInsert);
    console.log(`Synced ${toInsert.length} SnapChannels from production to dev.`);
  } else {
    console.log('No new SnapChannels to sync.');
  }
}

module.exports = { syncSnapChannelsFromProd };
