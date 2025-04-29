const { evaluateAndFixNickname } = require('../../utils/evaluateAndFixNickname');

/**
 * Enforces nickname format when a member changes their nickname.
 *
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */
async function enforceNicknameFormat(oldMember, newMember) {
  if (oldMember.nickname === newMember.nickname) return;

  await evaluateAndFixNickname(newMember, { skipPending: true });
}

module.exports = {
  enforceNicknameFormat,
};
