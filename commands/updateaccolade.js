const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Accolade } = require('../config/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('updateaccolade')
    .setDescription('Update the emoji and/or description for an existing accolade.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role associated with the accolade')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('New emoji for the accolade')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('New description for the accolade')
        .setRequired(false)),
  
  help: 'Admin-only command to update an existing accolade\'s emoji or description.',
  category: 'Admin',

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const emoji = interaction.options.getString('emoji');
    const description = interaction.options.getString('description');

    const accolade = await Accolade.findOne({ where: { role_id: role.id } });

    if (!accolade) {
      return interaction.reply({
        content: '❌ That role is not registered as an accolade.',
        ephemeral: true
      });
    }

    if (!emoji && !description) {
      return interaction.reply({
        content: '⚠️ You must provide at least one field to update (emoji or description).',
        ephemeral: true
      });
    }

    if (emoji) accolade.emoji = emoji;
    if (description) accolade.description = description;
    accolade.date_modified = Math.floor(Date.now() / 1000);

    await accolade.save();

    // Update the existing message in the Wall of Fame
    try {
      const guild = interaction.guild;
      const channel = await guild.channels.fetch(accolade.channel_id);
      if (channel && (channel.type === 0 || channel.type === 'GUILD_TEXT')) {
        await guild.members.fetch(); // Refresh cache
        const recipients = guild.members.cache
          .filter(member => member.roles.cache.has(accolade.role_id))
          .map(member => `• ${member}`)
          .join('\n') || '_No current recipients_';

        const updatedContent = `${accolade.emoji || ''} **[ACCOLADE: ${accolade.name}]**\n_${accolade.description}_\n\n**Recipients:**\n${recipients}\n_Updated: <t:${Math.floor(Date.now() / 1000)}:F>_`;

        const message = await channel.messages.fetch(accolade.message_id);
        if (message) await message.edit(updatedContent);
      }
    } catch (err) {
      console.error('❌ Failed to update accolade message:', err);
    }

    return interaction.reply({
      content: `✅ Accolade **${accolade.name}** has been updated.`,
      ephemeral: true
    });
  }
};
