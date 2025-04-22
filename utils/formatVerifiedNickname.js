/**
 * Formats a user's nickname:
 * - Adds [TAG] only if provided (used during /verify).
 * - Adds ⛔ at the end if the user is NOT verified.
 * - Truncates the base name if necessary to fit Discord's 32-character limit.
 * - Strips any known old unverified markers (🔒, ⚠️, ⚠, ⛔), including stacked ones.
 * - Does NOT remove ✅ or other parts of the nickname.
 *
 * @param {string} displayName - The user's current display name (casing preserved).
 * @param {boolean} verified - Whether the user is verified.
 * @param {string|null} tag - Optional org tag (added only during /verify).
 * @returns {string} - The properly formatted nickname.
 */
 function formatVerifiedNickname(displayName, verified = false, tag = null) {
  const MAX_NICKNAME_LENGTH = 32;
  const UNVERIFIED_SYMBOL = ' ⛔';
  const UNVERIFIED_MARKERS = new Set(['🔒', '⚠️', '⚠', '⛔']); // Added plain ⚠

  if (!displayName) return '';

  console.log(`\n[NICK FORMAT DEBUG] --------------------------`);
  console.log(`[NICK FORMAT DEBUG] Input displayName: "${displayName}"`);
  console.log(`[NICK FORMAT DEBUG] Verified: ${verified}`);
  console.log(`[NICK FORMAT DEBUG] Tag: ${tag || 'None'}`);

  // Helper to strip trailing stacked markers (handles multibyte grapheme clusters)
  function stripTrailingMarkers(name) {
    const markerPattern = /(?:\s*(?:🔒|⚠️|⚠|⛔)\s*)+$/gu;
    return name.replace(markerPattern, '').trim();
  }  

  // Remove trailing markers
  let strippedName = stripTrailingMarkers(displayName);
  console.log(`[NICK FORMAT DEBUG] After marker cleanup: "${strippedName}"`);

  // Handle tag logic
  let baseName = strippedName;
  if (tag) {
    const escapeForRegex = str => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const tagPattern = new RegExp(`^\\[${escapeForRegex(tag)}]\\s*`, 'i');
    if (!tagPattern.test(baseName)) {
      console.log(`[NICK FORMAT DEBUG] Tag missing or wrong. Stripping existing tag...`);
      baseName = baseName.replace(/^\[.*?]\s*/i, '').trim();
    } else {
      console.log(`[NICK FORMAT DEBUG] Tag already correct.`);
      baseName = baseName.replace(tagPattern, '').trim();
    }
  }

  console.log(`[NICK FORMAT DEBUG] Base name after tag handling: "${baseName}"`);

  // Rebuild formatted name with tag (if provided)
  let formatted = tag ? `[${tag}] ${baseName}` : baseName;

  if (!verified) {
    // Add the unverified symbol if missing
    if (!formatted.endsWith(UNVERIFIED_SYMBOL.trim())) {
      formatted += UNVERIFIED_SYMBOL;
    }

    // Truncate if too long
    if (formatted.length > MAX_NICKNAME_LENGTH) {
      const maxBaseLength = MAX_NICKNAME_LENGTH - UNVERIFIED_SYMBOL.length;
      const truncatedBase = formatted.slice(0, maxBaseLength).trim();
      formatted = `${truncatedBase}${UNVERIFIED_SYMBOL}`;
      console.log(`[NICK FORMAT DEBUG] Nickname truncated to fit: "${formatted}"`);
    }
  }

  console.log(`[NICK FORMAT DEBUG] Final formatted nickname: "${formatted}"`);
  console.log(`[NICK FORMAT DEBUG] --------------------------\n`);

  return formatted;
}

module.exports = { formatVerifiedNickname };
