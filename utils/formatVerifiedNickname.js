/**
 * Formats a verified nickname:
 * - Removes ✅ no matter what
 * - Adds [TAG] only if a tag is provided (e.g. during /verify)
 *
 * @param {string} displayName - The user's current display name
 * @param {string|null} tag - Optional tag to apply (e.g. during initial verification)
 * @returns {string} - The cleaned and optionally tagged nickname
 */
 function formatVerifiedNickname(displayName, tag = null) {
    if (!displayName) return '';
  
    // Remove ✅ (anywhere it appears)
    const noCheck = displayName.replace(/\s*✅\s*/g, '').trim();
  
    // If tag is provided, strip any existing [TAG] and add the correct one
    if (tag) {
      const stripped = noCheck.replace(/^\[.*?]\s*/i, '').trim();
      return `[${tag}] ${stripped}`;
    }
  
    // No tag provided, just return the name without ✅
    return noCheck;
  }
  
  module.exports = { formatVerifiedNickname };
  