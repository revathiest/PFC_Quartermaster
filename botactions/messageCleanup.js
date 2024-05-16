const fs = require('fs');

/**
 * Deletes messages older than a specified number of days in certain channels.
 * @param {Client} client The Discord client instance.
 */
async function deleteMessages(client) {
    try {
        const channelsData = fs.readFileSync('snapchannels.json');
        const channels = JSON.parse(channelsData);

        for (const channelInfo of channels) {
            const channel = await client.channels.fetch(channelInfo.channelId);

            if (channel && (channel.type === 0 || channel.type === 5)) {  // 0 for GUILD_TEXT and 5 for GUILD_NEWS
                const messages = await channel.messages.fetch({ limit: 100 });
                const purgeTime = new Date();
                purgeTime.setDate(purgeTime.getDate() - channelInfo.purgeTimeInDays);

                // Filter messages based on their timestamps
                const messagesToDelete = messages.filter(msg => msg.createdTimestamp <= purgeTime.getTime());

                // Bulk delete messages and log the action
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
