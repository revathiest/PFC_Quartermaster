/**
 * Ensures a nickname includes the ✅ and an optional [TAG] in the correct order.
 * 
 * @param {string} displayName - The user's display name (always defined).
 * @param {string|null} tag - The org tag (e.g. 'PFC'), or null if none.
 * @returns {string} - The corrected nickname.
 */
 function formatVerifiedNickname(displayName, tag = null) {
    if (!displayName) return '';
  
    let newNick;
  
    if (tag && displayName.startsWith(`[${tag}]`)) {
      const hasCheck = displayName.includes('✅');
      newNick = hasCheck
        ? displayName
        : displayName.replace(/^\[.*?\]/, match => `${match} ✅`);
    } else if (tag) {
      newNick = `[${tag}] ✅ ${displayName}`;
    } else {
      newNick = displayName.includes('✅')
        ? displayName
        : `✅ ${displayName}`;
    }
  
    return newNick;
  }
  
  module.exports = { formatVerifiedNickname };
  