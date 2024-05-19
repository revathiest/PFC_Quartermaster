const { handleRoleAssignment } = require('./userManagement/autoBanModule');
const { getInactiveUsersWithSingleRole } = require('./userManagement/inactiveUsersModule');

module.exports = {
    handleRoleAssignment,
    getInactiveUsersWithSingleRole
}