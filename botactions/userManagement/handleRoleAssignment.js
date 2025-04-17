const { sequelize } = require('../../config/database');
const { buildAccoladeEmbed } = require('../../utils/accoladeEmbedBuilder');
const Accolade = sequelize.models.Accolade;

const watermelonRoles = ['999136367554613398', '1241068008529727529'];

async function handleRoleAssignment(oldMember, newMember, client) {
  const hadWatermelonRole = watermelonRoles.some(role => oldMember.roles.cache.has(role));
  const hasWatermelonRole = watermelonRoles.some(role => newMember.roles.cache.has(role));

  if (!hadWatermelonRole && hasWatermelonRole) {
    try {
      const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: 25 });
      const roleChangeLog = fetchedLogs.entries.first();

      if (!roleChangeLog) {
        client.channels.cache.get(client.chanBotLog)?.send("No audit log found for role update.");
        return;
      }

      const { executor, target } = roleChangeLog;

      if (target.id === newMember.id && executor.id === newMember.id) {
        await client.channels.cache.get(client.chanBotLog)?.send(`User ${newMember.user.username} has assigned themselves a watermelon role.`);
        await newMember.ban({ reason: 'Automatically banned for self-assigning a watermelon role.' });
        await client.channels.cache.get(client.chanBotLog)?.send(`Automatically banned ${newMember.user.tag}.`);
      } else {
        client.channels.cache.get(client.chanBotLog)?.send(`${newMember.user.tag} was given a watermelon role by someone else.`);
      }
    } catch (error) {
      client.channels.cache.get(client.chanBotLog)?.send(`An error occurred during auto-ban: ${error}`);
    }
  }

  // 🎖️ Accolade Embed Update
  try {
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
    const changedRoleIds = new Set([...addedRoles.keys(), ...removedRoles.keys()]);

    for (const roleId of changedRoleIds) {
      const accolade = await Accolade.findOne({ where: { role_id: roleId } });
      if (!accolade) continue;

      const guild = newMember.guild;
      const channel = await guild.channels.fetch(accolade.channel_id).catch(() => null);
      if (!channel || (channel.type !== 0 && channel.type !== 'GUILD_TEXT')) continue;

      await guild.members.fetch();

      const recipients = guild.members.cache
        .filter(member => member.roles.cache.has(roleId))
        .map(member => member);

      const embed = buildAccoladeEmbed(accolade, recipients);

      const existingMessage = await channel.messages.fetch(accolade.message_id).catch(() => null);

      if (existingMessage) {
        await existingMessage.edit({ embeds: [embed], content: '' });
        console.log(`📝 Edited existing message for accolade: ${accolade.name}`);
      } else {
        const newMessage = await channel.send({ embeds: [embed] });
        accolade.message_id = newMessage.id;
        console.log(`📬 Sent new message for accolade: ${accolade.name}`);
      }

      accolade.date_modified = Math.floor(Date.now() / 1000);
      await accolade.save();
    }
  } catch (error) {
    console.error('❌ Error updating accolade role display:', error);
  }
}

module.exports = { handleRoleAssignment };
