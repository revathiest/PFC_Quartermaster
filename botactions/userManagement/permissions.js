// botactions/userManagement/permissions.js

/**
 * Checks if the user invoking the interaction has Administrator permissions.
 * @param {CommandInteraction} interaction - The Discord interaction object.
 * @returns {boolean} - True if the user is an admin, false otherwise.
 */
async function isAdmin(interaction) {

    const member = interaction.member || await interaction.guild.members.fetch(interaction.user.id);

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
  