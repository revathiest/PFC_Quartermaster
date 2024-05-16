// inactiveUsersModule.js
const path = require('path');

async function getInactiveUsersWithSingleRole(client) {
    const server = client.guilds.cache.first();
    const currentTime = new Date();
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000; // Two weeks in milliseconds

    if (!server) {
        console.log("No active server found.");
        return;
    }

    // Fetch offline members with only one role
    await server.members.fetch({ force: true });

    const usersWithSingleRole = [];
    server.members.cache.each(member => {
        if (member.roles.cache.size === 1 && currentTime - member.joinedAt > twoWeeksInMs) {
            const lastActivity = member.lastMessage ? member.lastMessage.createdAt : member.joinedAt;
            const inactiveDuration = currentTime - lastActivity;
            usersWithSingleRole.push({
                username: member.user.username,
                inactiveDuration: inactiveDuration
            });

            member.kick()
                .then(kickedMember => console.log(`Kicked user: ${kickedMember.user.username}`))
                .catch(console.error);
        }
    });

    if (usersWithSingleRole.length > 0) {
        const formattedUsers = usersWithSingleRole.map(user => `${user.username} - ${formatDuration(user.inactiveDuration)}`);
        const message = `Users with a single role, joined for more than one week, have been kicked from the server:\n\n${formattedUsers.join('\n')}`;
        const logChannel = client.channels.cache.get(client.chanBotLog);
        if (logChannel) {
            logChannel.send(message)
                .then(() => console.log(`Inactive users with single role list sent to channel ${logChannel.name}`))
                .catch(console.error);
        } else {
            console.log(`Channel ${client.chanBotLog} not found.`);
        }
    }
}

function formatDuration(duration) {
    const seconds = Math.floor(duration / 1000) % 60;
    const minutes = Math.floor(duration / 1000 / 60) % 60;
    const hours = Math.floor(duration / 1000 / 60 / 60) % 24;
    const days = Math.floor(duration / 1000 / 60 / 60 / 24);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = { getInactiveUsersWithSingleRole };
