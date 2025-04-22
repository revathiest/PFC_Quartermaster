const { VerifiedUser, OrgTag } = require('../../config/database');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');
const { pendingVerifications } = require('../../commands/tools/verify');

/**
 * Enforces nickname format for unverified users:
 * - Verified users have complete freedom (no enforcement).
 * - Unverified users get ⛔ added to the end of their nickname.
 *
 * @param {GuildMember} oldMember - The member before the update.
 * @param {GuildMember} newMember - The member after the update.
 */
async function enforceNicknameFormat(oldMember, newMember) {
  if (newMember.user.bot) return; // Skip bots
  if (oldMember.nickname === newMember.nickname) return; // Nickname didn't change

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

    const currentDisplayName = newMember.displayName;
    const expectedNickname = formatVerifiedNickname(currentDisplayName, isVerified, tag);

    if (newMember.nickname !== expectedNickname) {
      await newMember.setNickname(expectedNickname);
    } else {
    }
  } catch (err) {
    console.warn(`[NICK ENFORCE] Error processing nickname for ${newMember.user.tag}:`, err.message);
  }
}

module.exports = { enforceNicknameFormat };
