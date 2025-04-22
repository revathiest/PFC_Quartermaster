/**
 * Formats a user's nickname:
 * - Adds [TAG] only if provided (used during /verify).
 * - Adds 🔒 at the end if the user is NOT verified.
 * - Truncates the base name if necessary to fit Discord's 32-character limit.
 * - Does NOT remove ✅ or other parts of the nickname.
 *
 * @param {string} displayName - The user's current display name (casing preserved).
 * @param {boolean} verified - Whether the user is verified.
 * @param {string|null} tag - Optional org tag (added only during /verify).
 * @returns {string} - The properly formatted nickname.
 */
 function formatVerifiedNickname(displayName, verified = false, tag = null) {
  const MAX_NICKNAME_LENGTH = 32;
  const LOCK_SYMBOL = ' 🔒';

  if (!displayName) return '';

  // Apply tag if provided
  let strippedName = tag
    ? displayName.replace(/^\[.*?]\s*/i, '').trim()
    : displayName;

  let formatted = tag
    ? `[${tag}] ${strippedName}`
    : strippedName;

  if (!verified) {
    // Enforce the lock
    if (!formatted.endsWith('🔒')) {
      formatted += LOCK_SYMBOL;
    }

    // Truncate if too long
    if (formatted.length > MAX_NICKNAME_LENGTH) {
      const baseName = formatted.replace(/\s*🔒\s*$/, '').trim();
      const maxBaseLength = MAX_NICKNAME_LENGTH - LOCK_SYMBOL.length;
      const truncatedBase = baseName.slice(0, maxBaseLength).trim();
      formatted = `${truncatedBase}${LOCK_SYMBOL}`;
      console.log(`[NICK FORMAT] Nickname truncated to fit: ${formatted}`);
    }
  }

  return formatted;
}

module.exports = { formatVerifiedNickname };
