const { VerifiedUser, OrgTag } = require('../config/database');
const { formatVerifiedNickname } = require('./formatVerifiedNickname');
const { pendingVerifications } = require('../commands/user/verify');

/**
 * Evaluates and (if needed) fixes a member's nickname.
 *
 * @param {GuildMember} member
 * @param {Object} options
 * @param {boolean} [options.skipPending=false]
 * @param {Map<string, VerifiedUser>} [options.verifiedUsersMap]
 * @param {Array<string>} [options.knownTags]
 * @returns {Promise<boolean>} - True if nickname was updated, false otherwise.
 */
async function evaluateAndFixNickname(member, {
  skipPending = false,
  verifiedUsersMap = null,
  knownTags = null,
} = {}) {
  if (member.user.bot) return false;

  if (skipPending && pendingVerifications.has(member.id)) {
    return false;
  }

  let isVerified = false;
  let verifiedRecord = null;

  if (verifiedUsersMap) {
    verifiedRecord = verifiedUsersMap.get(member.id) || null;
    isVerified = !!verifiedRecord;
  } else {
    verifiedRecord = await VerifiedUser.findByPk(member.id);
    isVerified = !!verifiedRecord;
  }

  let tag = null;
  if (isVerified) {
    if (verifiedRecord?.manualTagOverride) {
      // Admin override takes priority
      tag = verifiedRecord.manualTagOverride;
    } else if (verifiedRecord?.rsiOrgId) {
      const org = await OrgTag.findByPk(verifiedRecord.rsiOrgId.toUpperCase());
      // Fallback to the org ID itself if no tag entry exists
      tag = org?.tag || verifiedRecord.rsiOrgId.toUpperCase() || null;
    }
  }
  

  if (!knownTags) {
    const orgTags = await OrgTag.findAll();
    knownTags = orgTags.filter(o => o.tag).map(o => o.tag.toUpperCase());
  }

  const currentDisplayName = member.displayName;
  const tagMatch = currentDisplayName.match(/^\[([^\]]+)\]\s*/);
  const currentTag = tagMatch ? tagMatch[1].toUpperCase() : null;

  let baseDisplayName = currentDisplayName.replace(/^\[[^\]]+\]\s*/, '').trim();
  let tagToUse = tag;
  const isKnownTag = currentTag && knownTags.includes(currentTag);

  if (currentTag) {
    if (isKnownTag) {
      if (!isVerified || (tag && currentTag !== tag.toUpperCase())) {
        baseDisplayName = baseDisplayName; // Already stripped above
      } else {
        tagToUse = tag;
      }
    } else if (isVerified && !tag) {
      tagToUse = currentTag;
    }
  }

  const expectedNickname = formatVerifiedNickname(baseDisplayName, isVerified, tagToUse);
  const currentNickname = member.nickname || member.user.username;

  if (currentNickname !== expectedNickname) {
    try {
      await member.setNickname(expectedNickname);
      return true;
    } catch (err) {
      console.warn(`⚠️ Failed to update ${member.user.tag}:`, err.message);
      return false;
    }
  }

  return false;
}

module.exports = {
  evaluateAndFixNickname,
};
