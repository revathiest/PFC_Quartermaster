const { VerifiedUser, OrgTag } = require('../../config/database');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');

async function enforceNicknameFormat(oldMember, newMember) {
  if (newMember.user.bot) return;
  if (oldMember.nickname === newMember.nickname) return;

  const discordUserId = newMember.id;

  try {
    const verified = await VerifiedUser.findByPk(discordUserId);
    if (!verified) {
      console.log(`[NICK ENFORCE] User ${newMember.user.tag} is not verified. Skipping.`);
      return;
    }

    const tag = verified.rsiOrgId
      ? (await OrgTag.findByPk(verified.rsiOrgId.toUpperCase()))?.tag || null
      : null;

    const currentNickname = newMember.nickname;
    const currentDisplayName = newMember.displayName;

    console.log(`[NICK ENFORCE] User: ${newMember.user.tag}`);
    console.log(`[NICK ENFORCE] Current nickname:`, currentNickname);
    console.log(`[NICK ENFORCE] Display name:`, currentDisplayName);
    console.log(`[NICK ENFORCE] Tag:`, tag);

    const expectedNickname = formatVerifiedNickname(currentDisplayName, tag);

    console.log(`[NICK ENFORCE] Expected nickname:`, expectedNickname);

    if (currentNickname !== expectedNickname) {
      console.log(`[NICK ENFORCE] Updating nickname to: ${expectedNickname}`);
      await newMember.setNickname(expectedNickname);
    } else {
      console.log(`[NICK ENFORCE] No change needed.`);
    }
  } catch (err) {
    console.warn(`[NICK ENFORCE] Error processing nickname for ${newMember.user.tag}:`, err.message);
  }
}

module.exports = { enforceNicknameFormat };
