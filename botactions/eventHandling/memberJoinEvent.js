const { VerifiedUser, OrgTag } = require('../../config/database');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');

/**
 * Handles adding 🔒 to new members who are not verified.
 *
 * @param {GuildMember} member - The member who just joined.
 */
async function handleMemberJoin(member) {
  if (member.user.bot) return; // Skip bots

  console.log(`[JOIN] New member joined: ${member.user.tag}`);

  try {
    const verified = await VerifiedUser.findByPk(member.id);
    const isVerified = !!verified;
    const tag = isVerified && verified?.rsiOrgId
      ? (await OrgTag.findByPk(verified.rsiOrgId.toUpperCase()))?.tag || null
      : null;

    const currentDisplayName = member.displayName;
    const expectedNickname = formatVerifiedNickname(currentDisplayName, isVerified, tag);

    if (member.nickname !== expectedNickname) {
      await member.setNickname(expectedNickname);
      console.log(`[JOIN] Set nickname for ${member.user.tag} → ${expectedNickname}`);
    } else {
      console.log(`[JOIN] Nickname already correct for ${member.user.tag}`);
    }
  } catch (err) {
    console.warn(`[JOIN] Could not set nickname for ${member.user.tag}:`, err.message);
  }
}

module.exports = { handleMemberJoin };
