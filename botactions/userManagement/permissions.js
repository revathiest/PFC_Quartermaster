// botactions/userManagement/permissions.js

/**
 * Checks if the user invoking the interaction has Administrator permissions.
 * @param {CommandInteraction} interaction - The Discord interaction object.
 * @returns {boolean} - True if the user is an admin, false otherwise.
 */
 function isAdmin(interaction) {

    if (!interaction){
        console.log('[PERMISSIONS] No interaction defined.');
        return false;
    }
    if (!interaction.member){
        console.log('[PERMISSIONS] No member defined in interaction.');
        return false;
    }

    const member = interaction.member;

    if (!member){
        console.log('[PERMISSIONS] Unable to extract member.');
    }
    
    if (member.permissions && member.permissions.has('Administrator')) {
        return true;
      }
  }
  
  module.exports = {
    isAdmin
  };
  