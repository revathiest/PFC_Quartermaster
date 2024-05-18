const roleWatermelon = '999136367554613398'; // Role ID for the special role

async function handleRoleAssignment(oldMember, newMember, client) {
    if (!oldMember.roles.cache.has(roleWatermelon) && newMember.roles.cache.has(roleWatermelon)) {
        try {
            const fetchedLogs = await newMember.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_ROLE_UPDATE' // Discord Audit Log type for role updates
            });

            const roleChangeLog = fetchedLogs.entries.first();
            if (!roleChangeLog) {
                client.channels.cache.get(client.chanBotLog).send("No audit log found for role update.");
                return;
            }

            const { executor, target } = roleChangeLog;

            if (target.id === newMember.id && executor.id === newMember.id) {
                client.channels.cache.get(client.chanBotLog).send(`User ${newMember.user.username} has assigned themselves the watermelon role.`);
                
                await newMember.ban({ reason: 'Automatically banned for self-assigning the watermelon role.' });
                client.channels.cache.get(client.chanBotLog).send(`Automatically banned ${newMember.user.tag}.`);
            } else {
                client.channels.cache.get(client.chanBotLog).send(`${newMember.user.tag} was given the watermelon role by someone else.`);
            }
        } catch (error) {
            client.channels.cache.get(client.chanBotLog).send(`An error occurred when checking the audit logs or banning the user: ${error}`);
        }
    }
}

module.exports = { handleRoleAssignment };
