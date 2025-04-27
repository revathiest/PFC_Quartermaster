const { VerifiedUser, OrgTag } = require('../../config/database');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');
const { pendingVerifications } = require('../../commands/tools/verify');

/**
 * Enforces nickname format for unverified users:
 * - Verified users have complete freedom (except enforced org tag logic).
 * - Unverified users get ⛔ added to the end of their nickname.
 * - Preserves unknown tags for verified users with no matching org.
 *
 * @param {GuildMember} oldMember - The member before the update.
 * @param {GuildMember} newMember - The member after the update.
 */
async function enforceNicknameFormat(oldMember, newMember) {
  if (newMember.user.bot) return; // Skip bots
  if (oldMember.nickname === newMember.nickname) return; // No nickname change

  const discordUserId = newMember.id;

  if (pendingVerifications.has(discordUserId)) {
    console.log(`[NICK ENFORCE] Skipping enforcement for ${newMember.user.tag}, verification in progress.`);
    return;
  }

  try {
    const verified = await VerifiedUser.findByPk(discordUserId);
    const isVerified = !!verified;
    const tag = isVerified && verified?.rsiOrgId
      ? (await OrgTag.findByPk(verified.rsiOrgId.toUpperCase()))?.tag || null
      : null;

    const knownOrgTags = await OrgTag.findAll();
    const knownTags = knownOrgTags
      .filter(o => o.tag)
      .map(o => o.tag.toUpperCase());

    const currentDisplayName = newMember.displayName;
    const tagMatch = currentDisplayName.match(/^\[([^\]]+)\]\s*/);
    const currentTag = tagMatch ? tagMatch[1].toUpperCase() : null;

    let baseDisplayName = currentDisplayName;
    let tagToUse = tag;
    const isKnownTag = currentTag && knownTags.includes(currentTag);

    if (currentTag) {
      if (isKnownTag) {
        if (isVerified) {
          if (!tag || currentTag !== tag.toUpperCase()) {
            // Verified, but no org or wrong tag → strip known tag
            baseDisplayName = currentDisplayName.replace(/^\[[^\]]+\]\s*/, '').trim();
          }
          // Correct tag stays
        } else {
          // Unverified → strip known tag
          baseDisplayName = currentDisplayName.replace(/^\[[^\]]+\]\s*/, '').trim();
        }
      } else if (isVerified && (!tag || !knownTags.includes(tag.toUpperCase()))) {
        // Verified with unknown tag → preserve the unknown tag
        tagToUse = currentTag;
      }
    }

    const expectedNickname = formatVerifiedNickname(baseDisplayName, isVerified, tagToUse);
    const currentNickname = newMember.nickname || newMember.user.username;

    if (currentNickname !== expectedNickname) {
      await newMember.setNickname(expectedNickname);
      console.log(`[NICK ENFORCE] Updated ${newMember.user.tag} → ${expectedNickname}`);
    }
  } catch (err) {
    console.warn(`[NICK ENFORCE] Error processing nickname for ${newMember.user.tag}:`, err.message);
  }
}

module.exports = { enforceNicknameFormat };
