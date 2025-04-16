const { sequelize } = require('../../config/database');
const Accolade = sequelize.models.Accolade;

async function handleRoleAssignment(oldMember, newMember, client) {
  try {
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
    const changedRoleIds = new Set([...addedRoles.keys(), ...removedRoles.keys()]);

    for (const roleId of changedRoleIds) {
      const accolade = await Accolade.findOne({ where: { role_id: roleId } });
      if (!accolade) continue;

      const guild = newMember.guild;
      const channel = await guild.channels.fetch(accolade.channel_id);
      if (!channel || channel.type !== 0 && channel.type !== 'GUILD_TEXT') {
        console.warn(`⚠️ Channel for accolade "${accolade.name}" is invalid or missing.`);
        continue;
      }

      await guild.members.fetch(); // Ensure up-to-date member list

      const roleMembers = guild.members.cache
        .filter(member => member.roles.cache.has(roleId))
        .map(member => `• ${member}`)
        .join('\n') || '_No current recipients_';

      const updatedContent = `${accolade.emoji || ''} **[ACCOLADE: ${accolade.name}]**\n_${accolade.description}_\n\n**Recipients:**\n${roleMembers}\n_Updated: <t:${Math.floor(Date.now() / 1000)}:F>_`;

      const message = await channel.messages.fetch(accolade.message_id);
      if (message) {
        await message.edit(updatedContent);
        console.log(`✅ Wall of Fame updated for accolade: ${accolade.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error updating Wall of Fame on role assignment:', error);
  }
}

module.exports = { handleRoleAssignment };
