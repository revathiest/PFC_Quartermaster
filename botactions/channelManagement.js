const { registerChannels } = require("./channelManagement/channelRegistry");
const { deleteMessages } = require('./channelManagement/messageCleanup');
const { addSnapChannel, removeSnapChannel, listSnapChannels } = require('./channelManagement/snapChannels');

module.exports = {
    registerChannels,
    deleteMessages,
    addSnapChannel,
    removeSnapChannel,
    listSnapChannels
}