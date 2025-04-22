const { VerifiedUser, OrgTag } = require('../../config/database');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');

/**
 * Sweeps all members of the guild and applies/removes the 🔒 unverified marker.
 *
 * @param {object} client - The Discord.js client instance.
 */
async function sweepVerifiedNicknames(client) {
  const guild = client.guilds.cache.first(); // Assuming single-server bot
  if (!guild) {
    console.warn('[SWEEP] No guild found in cache. Cannot run sweep.');
    return;
  }

  console.log('[SWEEP] Starting nickname sweep...');

  const verifiedUsers = await VerifiedUser.findAll();
  const verifiedUserIds = new Set(verifiedUsers.map(u => u.discordUserId));

  let checked = 0, updated = 0, missing = 0;

  const members = await guild.members.fetch(); // Get all members from the server

  for (const member of members.values()) {
    checked++;

    if (member.user.bot) continue; // Skip bots

    const isVerified = verifiedUserIds.has(member.id);
    const verifiedRecord = verifiedUsers.find(u => u.discordUserId === member.id);
    const tag = isVerified && verifiedRecord?.rsiOrgId
      ? (await OrgTag.findByPk(verifiedRecord.rsiOrgId.toUpperCase()))?.tag || null
      : null;

    const currentDisplayName = member.displayName;
    const expectedNickname = formatVerifiedNickname(currentDisplayName, isVerified, tag);

    if (member.nickname !== expectedNickname) {
      try {
        await member.setNickname(expectedNickname);
        console.log(`[SWEEP] Updated ${member.user.tag} → ${expectedNickname}`);
        updated++;
      } catch (err) {
        console.warn(`[SWEEP] Could not update ${member.user.tag}:`, err.message);
      }
    }
  }

  console.log(`[SWEEP] Finished. Checked: ${checked}, Updated: ${updated}, Missing: ${missing}`);
}

module.exports = { sweepVerifiedNicknames };
