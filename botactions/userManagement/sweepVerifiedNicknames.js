const { VerifiedUser, OrgTag } = require('../../config/database');
const { evaluateAndFixNickname } = require('../../utils/evaluateAndFixNickname');

/**
 * Sweeps all guild members and enforces nickname formatting.
 *
 * @param {object} client - The Discord.js client instance.
 */
async function sweepVerifiedNicknames(client) {
  console.log('🧽 Sweeping verified nicknames...');
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.warn('🚫 No guild found in cache. Cannot run sweep.');
    return;
  }

  const [verifiedUsers, orgTags] = await Promise.all([
    VerifiedUser.findAll(),
    OrgTag.findAll(),
  ]);

  const verifiedUsersMap = new Map(verifiedUsers.map(u => [u.discordUserId, u]));
  const knownTags = orgTags.filter(o => o.tag).map(o => o.tag.toUpperCase());

  const members = await guild.members.fetch();

  let checked = 0, updated = 0;

  for (const member of members.values()) {
    checked++;
    const updatedNickname = await evaluateAndFixNickname(member, {
      verifiedUsersMap,
      knownTags,
      skipPending: false,
    });

    if (updatedNickname) updated++;
  }
  console.log(`✅ Nickname sweep complete. Checked: ${checked}, Updated: ${updated}`);
}

module.exports = {
  sweepVerifiedNicknames,
};
