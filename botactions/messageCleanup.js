const fs = require('fs');
const path = require('path');

async function deleteMessages(client) {
    try {
        // Properly construct the path to the file
        const filePath = path.join(__dirname, '..', 'snapchannels.json');
        const channelsData = fs.readFileSync(filePath);
        const channels = JSON.parse(channelsData);

        for (const channelInfo of channels) {
            const channel = await client.channels.fetch(channelInfo.channelId);

            if (channel && (channel.type === 0 || channel.type === 5)) {
                const messages = await channel.messages.fetch({ limit: 100 });
                const purgeTime = new Date();
                purgeTime.setDate(purgeTime.getDate() - channelInfo.purgeTimeInDays);

                const messagesToDelete = messages.filter(msg => msg.createdTimestamp <= purgeTime.getTime());

                if (messagesToDelete.size > 0) {
                    await channel.bulkDelete(messagesToDelete, true);
                    console.log(`Deleted ${messagesToDelete.size} messages in channel ${channel.name}`);
                } else {
                    console.log(`No messages to delete in channel ${channel.name}`);
                }
            } else {
                console.log(`Invalid channel type or channel does not exist: ${channelInfo.channelId}`);
            }
        }
    } catch (error) {
        console.error('Error deleting messages:', error);
    }
}

module.exports = { deleteMessages };
