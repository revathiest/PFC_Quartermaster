const { registerChannels } = require("./channelManagement/channelRegistry");
const { deleteMessages } = require('./channelManagement/messageCleanup');

module.exports = {
    registerChannels,
    deleteMessages
}