const { handleRoleAssignment } = require('./userManagement/handleRoleAssignment');
const { getInactiveUsersWithSingleRole } = require('./userManagement/inactiveUsersModule');

module.exports = {
    handleRoleAssignment,
    getInactiveUsersWithSingleRole
}