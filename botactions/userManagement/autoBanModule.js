const watermelonRoles = ['999136367554613398', '1241068008529727529']; // Array of role IDs for the special roles

async function handleRoleAssignment(oldMember, newMember, client) {
    const hadWatermelonRole = watermelonRoles.some(role => oldMember.roles.cache.has(role));
    const hasWatermelonRole = watermelonRoles.some(role => newMember.roles.cache.has(role));

    if (!hadWatermelonRole && hasWatermelonRole) {
        try {
            const fetchedLogs = await newMember.guild.fetchAuditLogs({
                limit: 1,
                type: 25 // Correct integer value for MEMBER_ROLE_UPDATE
            });

            const roleChangeLog = fetchedLogs.entries.first();
            if (!roleChangeLog) {
                client.channels.cache.get(client.chanBotLog).send("No audit log found for role update.");
                return;
            }

            const { executor, target } = roleChangeLog;

            if (target.id === newMember.id && executor.id === newMember.id) {
                client.channels.cache.get(client.chanBotLog).send(`User ${newMember.user.username} has assigned themselves a watermelon role.`);
                
                await newMember.ban({ reason: 'Automatically banned for self-assigning a watermelon role.' });
                client.channels.cache.get(client.chanBotLog).send(`Automatically banned ${newMember.user.tag}.`);
            } else {
                client.channels.cache.get(client.chanBotLog).send(`${newMember.user.tag} was given a watermelon role by someone else.`);
            }
        } catch (error) {
            client.channels.cache.get(client.chanBotLog).send(`An error occurred when checking the audit logs or banning the user: ${error}`);
        }
    }
}

module.exports = { handleRoleAssignment };
