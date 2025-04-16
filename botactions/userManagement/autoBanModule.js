const { sequelize } = require('../../config/database');
const Accolade = sequelize.models.Accolade;

const watermelonRoles = ['999136367554613398', '1241068008529727529']; // Array of role IDs for the special roles

async function handleRoleAssignment(oldMember, newMember, client) {
    const hadWatermelonRole = watermelonRoles.some(role => oldMember.roles.cache.has(role));
    const hasWatermelonRole = watermelonRoles.some(role => newMember.roles.cache.has(role));

    if (!hadWatermelonRole && hasWatermelonRole) {
        try {
            const fetchedLogs = await newMember.guild.fetchAuditLogs({
                limit: 1,
                type: 25 // MEMBER_ROLE_UPDATE
            });

            const roleChangeLog = fetchedLogs.entries.first();
            if (!roleChangeLog) {
                client.channels.cache.get(client.chanBotLog)?.send("No audit log found for role update.");
                return;
            }

            const { executor, target } = roleChangeLog;

            if (target.id === newMember.id && executor.id === newMember.id) {
                client.channels.cache.get(client.chanBotLog)?.send(`User ${newMember.user.username} has assigned themselves a watermelon role.`);
                
                await newMember.ban({ reason: 'Automatically banned for self-assigning a watermelon role.' });
                client.channels.cache.get(client.chanBotLog)?.send(`Automatically banned ${newMember.user.tag}.`);
            } else {
                client.channels.cache.get(client.chanBotLog)?.send(`${newMember.user.tag} was given a watermelon role by someone else.`);
            }
        } catch (error) {
            client.channels.cache.get(client.chanBotLog)?.send(`An error occurred when checking the audit logs or banning the user: ${error}`);
        }
    }

    // 🎖️ Wall of Fame Accolade Role Handling
    try {
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        const changedRoleIds = new Set([...addedRoles.keys(), ...removedRoles.keys()]);

        for (const roleId of changedRoleIds) {
            const accolade = await Accolade.findOne({ where: { role_id: roleId } });
            if (!accolade) continue;

            const guild = newMember.guild;
            const channel = await guild.channels.fetch(accolade.channel_id);
            if (!channel || (channel.type !== 0 && channel.type !== 'GUILD_TEXT')) {
                console.warn(`⚠️ Channel for accolade "${accolade.name}" is invalid or not text-based.`);
                continue;
            }

            await guild.members.fetch();

            const recipients = guild.members.cache
                .filter(member => member.roles.cache.has(roleId))
                .map(member => `• ${member}`)
                .join('\n') || '_No current recipients_';

            const updatedContent = `${accolade.emoji || ''} **[ACCOLADE: ${accolade.name}]**\n_${accolade.description}_\n\n**Recipients:**\n${recipients}\n_Updated: <t:${Math.floor(Date.now() / 1000)}:F>_`;

            const message = await channel.messages.fetch(accolade.message_id);
            if (message) {
                await message.edit(updatedContent);
                console.log(`✅ Wall of Fame updated for accolade: ${accolade.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Error while updating accolade role display:', error);
    }
}

module.exports = { handleRoleAssignment };
