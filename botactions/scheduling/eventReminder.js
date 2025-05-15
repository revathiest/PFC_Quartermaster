// Define intervals here if not globally defined
const intervals = {
    604800000: '1 week',
    259200000: '3 days',
    86400000: '1 day',
    3600000: '1 hour',
    0: 'starting time',
};

async function checkEvents(client) {
    client.guilds.cache.forEach(async (guild) => {
        const events = Array.from(guild.scheduledEvents.cache.values());
        const logChannel = client.channels.cache.get(client.chanLobby);

        if (!logChannel) {
            console.error(`Log channel not found in guild ${guild.name}.`);
            return;
        }

        for (const event of events) {
            const timeDiff = event.scheduledStartTimestamp - Date.now();
            for (const interval in intervals) {
                if (timeDiff <= interval && timeDiff >= interval - 60000) {
                    const message = (interval === 0) ? `Reminder: Event "${event.name}" is starting now! Join here: ${event.url}` : `Reminder: Event "${event.name}" starts in ${intervals[interval]}. Sign up here: ${event.url}`;
                    await logChannel.send(message);
                }
            }
        }
    });
}


module.exports = {
    checkEvents
};
