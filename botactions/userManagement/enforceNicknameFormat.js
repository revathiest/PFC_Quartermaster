const { VerifiedUser, OrgTag } = require('../../config/database');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');
const { pendingVerifications } = require('../../commands/tools/verify');

/**
 * Enforces nickname format for unverified users:
 * - Verified users have complete freedom (no enforcement).
 * - Unverified users get 🔒 added to the end of their nickname.
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
    
    const currentNickname = newMember.nickname || newMember.user.username;

    if (isVerified) {
      // Strip 🔒 from anywhere in the nickname
      const cleanedNickname = currentNickname.replace(/\s*🔒\s*/g, '').trim();

      if (currentNickname !== cleanedNickname) {
        console.log(`[NICK ENFORCE] Removing 🔒 from verified user ${newMember.user.tag}.`);
        await newMember.setNickname(cleanedNickname);
      } else {
        console.log(`[NICK ENFORCE] Verified user ${newMember.user.tag} has a clean nickname. No change needed.`);
      }
      return; // Done for verified users!
    }

    // Unverified users → enforce lock (never apply tag for unverified)
    const currentDisplayName = newMember.displayName;
    const expectedNickname = formatVerifiedNickname(currentDisplayName, false, null); // Unverified → lock applied

    console.log(`[NICK ENFORCE] User: ${newMember.user.tag}`);
    console.log(`[NICK ENFORCE] Current nickname:`, newMember.nickname);
    console.log(`[NICK ENFORCE] Display name:`, currentDisplayName);
    console.log(`[NICK ENFORCE] Expected nickname:`, expectedNickname);

    if (newMember.nickname !== expectedNickname) {
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
