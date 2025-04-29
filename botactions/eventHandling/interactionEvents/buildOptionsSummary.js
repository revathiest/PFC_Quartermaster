// eventHandling/interactionEvents/buildOptionsSummary.js

/**
 * Build a clean, readable summary of options for an interaction.
 * @param {CommandInteraction | AutocompleteInteraction} interaction
 * @returns {Promise<string>} Summary of options
 */
 async function buildOptionsSummary(interaction) {
    const options = interaction.options?.data ?? [];
    if (options.length === 0) return 'no options';
  
    const parts = [];
  
    for (const opt of options) {
      let value = opt.value;
  
      switch (opt.type) {
        case 3: // STRING
          value = `"${value}"`;
          break;
        case 4: // INTEGER
        case 10: // NUMBER
          break; // Already fine
        case 5: // BOOLEAN
          value = value ? 'true' : 'false';
          break;
        case 6: // USER
          const user = interaction.guild?.members.cache.get(opt.value)?.user;
          value = user?.globalName || user?.username || `<UnknownUser>`;
          break;
        case 7: // CHANNEL
          try {
            const channel = await interaction.client.channels.fetch(opt.value);
            value = channel ? `#${channel.name}` : `<UnknownChannel>`;
          } catch (err) {
            console.warn(`⚠️ Could not fetch channel for option ${opt.name}:`, err.message);
            value = `<UnknownChannel>`;
          }
          break;
        case 8: // ROLE
          const role = interaction.guild?.roles.cache.get(opt.value);
          value = role ? `@${role.name}` : `<UnknownRole>`;
          break;
        case 9: // MENTIONABLE
          const mentionUser = interaction.guild?.members.cache.get(opt.value)?.user;
          const mentionRole = interaction.guild?.roles.cache.get(opt.value);
          if (mentionUser) {
            value = mentionUser.globalName || mentionUser.username || `<UnknownUser>`;
          } else if (mentionRole) {
            value = `@${mentionRole.name}`;
          } else {
            value = `<UnknownMentionable>`;
          }
          break;
        default:
          value = opt.value;
          break;
      }
  
      parts.push(`${opt.name}: ${value}`);
    }
  
    return parts.length > 0 ? parts.join(', ') : 'no options';
  }
  
  module.exports = {
    buildOptionsSummary,
  };
  