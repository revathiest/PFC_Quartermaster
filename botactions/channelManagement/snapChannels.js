const { SnapChannel } = require('../../config/database');

// Add a new channel
async function addSnapChannel(channelId, purgeTimeInDays, serverId) {
  try {
    await SnapChannel.create({ channelId, purgeTimeInDays, serverId });
    console.log(`Channel ${channelId} added successfully.`);
  } catch (error) {
    console.error('Error adding channel:', error);
  }
}

// Remove a channel
async function removeSnapChannel(channelId) {
  try {
    const channel = await SnapChannel.findOne({ where: { channelId } });
    if (channel) {
      await channel.destroy();
      console.log(`Channel ${channelId} removed successfully.`);
    } else {
      console.log(`Channel ${channelId} not found.`);
    }
  } catch (error) {
    console.error('Error removing channel:', error);
  }
}

// List all channels
async function listSnapChannels() {
  try {
    const channels = await SnapChannel.findAll();
    channels.forEach(channel => {
      console.log(`Channel ID: ${channel.channelId}, Purge Time: ${channel.purgeTimeInDays} days, Server ID: ${channel.serverId}`);
    });
  } catch (error) {
    console.error('Error listing channels:', error);
  }
}

module.exports = {
  addSnapChannel,
  removeSnapChannel,
  listSnapChannels
};