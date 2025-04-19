//botactions/eventHandling/messageEvents/actionPerformer.js
module.exports = function performAction(message, client, actionDetail) {
    if (actionDetail.action === "personal") {
        if (
            (actionDetail.userId && message.author.id === actionDetail.userId) ||
            (actionDetail.userId && message.author.username.toLowerCase() === actionDetail.userId.toLowerCase())
        ) {
            message.channel.send(actionDetail.response);
            return true;
        } else {
            console.log("Personal action ignored: User does not match");
            return false;
        }
    } else if (actionDetail.action === "respond") {
        message.channel.send(actionDetail.response);
        return true;
    } else if (actionDetail.action === "delete") {
        const channelName = message.channel.name;
        const username = message.author.username;
        const deletionMessage = `The following message has been deleted from channel ${channelName}. Sender - ${username}`;
        const responseChannel = client.channels.cache.get(client.chanProfanityAlert);
        if (responseChannel && responseChannel.isTextBased?.()) {
            responseChannel.send(deletionMessage);
            responseChannel.send(message.content);
        }
        message.delete();
        return true;
    }
    return false;
};