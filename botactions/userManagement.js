const { handleRoleAssignment } = require('./userManagement/handleRoleAssignment');
const { getInactiveUsersWithSingleRole } = require('./userManagement/inactiveUsersModule');
const { enforceNicknameFormat } = require('./userManagement/enforceNicknameFormat');
const { sweepVerifiedNicknames } = require('./userManagement/sweepVerifiedNicknames');

module.exports = {
  handleRoleAssignment,
  getInactiveUsersWithSingleRole,
  enforceNicknameFormat,
  sweepVerifiedNicknames
};
