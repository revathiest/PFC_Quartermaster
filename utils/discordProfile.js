const { getClient } = require('../discordClient');

/**
 * Fetch Discord profile info for a user.
 * @param {string} userId Discord user ID
 * @returns {Promise<{ id: string, username: string, displayName: string, avatar: string, roles: string[], aboutMe: string|null }>}
 */
async function fetchDiscordProfileInfo(userId) {
  const client = getClient();
  const config = require('../config.json');
  const guild = client?.guilds?.cache.get(config.guildId);
  if (!client || !guild) {
    throw new Error('Discord client unavailable');
  }

  const member = await guild.members.fetch(userId);

  const avatar = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const roles = member.roles.cache.map(r => r.name);
  const aboutMe = member.user?.bio || null;

  return {
    id: member.id,
    username: member.user.username,
    displayName: member.displayName,
    avatar,
    roles,
    aboutMe
  };
}

module.exports = { fetchDiscordProfileInfo };
