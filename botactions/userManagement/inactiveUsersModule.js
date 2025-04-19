const { formatDuration } = require('../../botactions/utilityFunctions');

async function getInactiveUsersWithSingleRole(client) {
    const server = client.guilds.cache.first();
    const currentTime = new Date();
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000; // Two weeks in milliseconds

    if (!server) {
        console.log("🛑 No active server found.");
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
                .then(kickedMember => console.log(`👢 Kicked user: ${kickedMember.user.username}`))
                .catch(error => console.error(`❌ Failed to kick user: ${member.user.username}`, error));
        }
    });

    if (usersWithSingleRole.length > 0) {
        const formattedUsers = usersWithSingleRole.map(user => `${user.username} - ${formatDuration(user.inactiveDuration)}`);
        const message = `🧹 Users with a single role, joined for more than two weeks, have been kicked from the server:\n\n${formattedUsers.join('\n')}`;
        const logChannel = client.channels.cache.get(client.chanBotLog);
        if (logChannel) {
            logChannel.send(message)
                .then(() => console.log(`📨 Inactive user list sent to #${logChannel.name}`))
                .catch(error => console.error(`❌ Failed to send log message to #${logChannel.name}`, error));
        } else {
            console.log(`⚠️ Log channel (ID: ${client.chanBotLog}) not found.`);
        }
    } else {
        console.log("✅ No inactive users with a single role found.");
    }
}

module.exports = { getInactiveUsersWithSingleRole };
