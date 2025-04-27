const { VerifiedUser, OrgTag } = require('../../config/database');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');

/**
 * Sweeps all members of the guild and applies/removes the ⛔ unverified marker.
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

  const knownOrgTags = await OrgTag.findAll();
  const knownTags = knownOrgTags
    .filter(o => o.tag)
    .map(o => o.tag.toUpperCase());

  let checked = 0, updated = 0;

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
    const tagMatch = currentDisplayName.match(/^\[([^\]]+)\]\s*/);
    const currentTag = tagMatch ? tagMatch[1].toUpperCase() : null;

    let baseDisplayName = currentDisplayName.replace(/^\[[^\]]+\]\s*/, '').trim();
    let tagToUse = tag;

    const isKnownTag = currentTag && knownTags.includes(currentTag);

    if (currentTag) {
      if (isKnownTag) {
        if (!isVerified || (tag && currentTag !== tag.toUpperCase())) {
          // Strip known tag if unverified OR wrong known tag
          baseDisplayName = currentDisplayName.replace(/^\[[^\]]+\]\s*/, '').trim();
        } else {
          // Correct known tag → keep it
          tagToUse = tag;
        }
      } else if (isVerified && !tag) {
        // Unknown tag, verified, and no matching org tag → preserve the current tag
        tagToUse = currentTag;
      }
    }

    const expectedNickname = formatVerifiedNickname(baseDisplayName, isVerified, tagToUse);
    const currentNickname = member.nickname || member.user.username;

    if (currentNickname !== expectedNickname) {
      try {
        await member.setNickname(expectedNickname);
        console.log(`[SWEEP] Updated ${member.user.tag} → ${expectedNickname}`);
        updated++;
      } catch (err) {
        console.warn(`[SWEEP] Could not update ${member.user.tag}:`, err.message);
      }
    }
  }

  console.log(`[SWEEP] Finished. Checked: ${checked}, Updated: ${updated}`);
}

module.exports = { sweepVerifiedNicknames };
