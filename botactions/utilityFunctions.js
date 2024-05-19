function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const secs = Math.floor(totalSeconds % 60);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const hours = Math.floor(totalSeconds / 3600);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const days = Math.floor(totalSeconds / 86400);
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

async function getChannelNameById(channelId, client) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
            return channel.name;
        } else {
            throw new Error(`Channel with ID ${channelId} not found.`);
        }
    } catch (error) {
        console.error(`Error fetching channel name for ID ${channelId}:`, error);
        throw error;
    }
}

async function getGuildNameById(guildId, client) {
    try {
        const guild = await client.guilds.fetch(guildId);
        if (guild) {
            return guild.name;
        } else {
            throw new Error(`Guild with ID ${guildId} not found.`);
        }
    } catch (error) {
        console.error(`Error fetching guild name for ID ${guildId}:`, error);
        throw error;
    }
}

module.exports = {
    formatTime,
    formatDuration,
    getChannelNameById,
    getGuildNameById
};
