module.exports = async function getGuildMembersWithRoles(guild, roleNames) {
    await guild.members.fetch(); // Ensure cache is loaded
    const targetRoleIds = guild.roles.cache
      .filter(role => roleNames.includes(role.name))
      .map(role => role.id);
  
    return guild.members.cache
      .filter(member => member.roles.cache.some(role => targetRoleIds.includes(role.id)))
      .map(member => member);
  };
  