const { VerifiedUser } = require('../config/database');

/**
 * Checks if a Discord user is verified
 * @param {string} discordUserId
 * @returns {Promise<boolean>}
 */
async function isUserVerified(discordUserId) {
  const result = await VerifiedUser.findByPk(discordUserId);
  return !!result;
}

module.exports = { isUserVerified };
