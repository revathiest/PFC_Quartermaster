// botactions/userManagement/permissions.js

/**
 * Checks if the user invoking the interaction has Administrator permissions.
 * @param {CommandInteraction} interaction - The Discord interaction object.
 * @returns {boolean} - True if the user is an admin, false otherwise.
 */
 function isAdmin(interaction) {
    return interaction.member?.permissions?.has?.('Administrator');
  }
  
  module.exports = {
    isAdmin
  };
  