const { VerifiedUser, OrgTag } = require('../../config/database');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');

async function sweepVerifiedNicknames(client) {
  const guild = client.guilds.cache.first(); // Assuming single-server bot
  if (!guild) {
    console.warn('[SWEEP] No guild found in cache. Cannot run sweep.');
    return;
  }

  console.log('[SWEEP] Starting nickname sweep...');

  const verifiedUsers = await VerifiedUser.findAll();
  let checked = 0, updated = 0, missing = 0;

  for (const user of verifiedUsers) {
    checked++;
    const member = await guild.members.fetch(user.discordUserId).catch(() => null);

    if (!member) {
      console.warn(`[SWEEP] User ${user.discordUserId} not found in guild.`);
      missing++;
      continue;
    }

    const tag = user.rsiOrgId
      ? (await OrgTag.findByPk(user.rsiOrgId.toUpperCase()))?.tag || null
      : null;

    const currentDisplayName = member.displayName;
    const expectedNickname = formatVerifiedNickname(currentDisplayName, tag);

    if (member.nickname !== expectedNickname) {
      try {
        await member.setNickname(expectedNickname);
        console.log(`[SWEEP] Updated ${member.user.tag} → ${expectedNickname}`);
        updated++;
      } catch (err) {
        console.warn(`[SWEEP] Could not update ${member.user.tag} to ${expectedNickname}:`, err.message);
      }
    }
  }

  console.log(`[SWEEP] Finished. Checked: ${checked}, Updated: ${updated}, Missing: ${missing}`);
}

module.exports = { sweepVerifiedNicknames };
