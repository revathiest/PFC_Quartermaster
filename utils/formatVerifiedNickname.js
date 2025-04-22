/**
 * Formats a user's nickname:
 * - Adds [TAG] only if provided (used during /verify).
 * - Adds 🔒 at the end if the user is NOT verified.
 * - Does NOT remove ✅ or other parts of the nickname.
 *
 * @param {string} displayName - The user's current display name (casing preserved).
 * @param {boolean} verified - Whether the user is verified.
 * @param {string|null} tag - Optional org tag (added only during /verify).
 * @returns {string} - The properly formatted nickname.
 */
 function formatVerifiedNickname(displayName, verified = false, tag = null) {
    if (!displayName) return '';
  
    // If tag is provided, strip any existing [TAG] and add the correct one.
    let strippedName = tag
      ? displayName.replace(/^\[.*?]\s*/i, '').trim()
      : displayName;
  
    let formatted = tag
      ? `[${tag}] ${strippedName}`
      : strippedName;
  
    // Add 🔒 if NOT verified (and if not already there).
    if (!verified && !formatted.endsWith('🔒')) {
      formatted += ' 🔒';
    }
  
    // If verified, ensure 🔒 is removed if it was there.
    if (verified) {
      formatted = formatted.replace(/\s*🔒$/, '').trim();
    }
  
    return formatted;
  }
  
  module.exports = { formatVerifiedNickname };
  