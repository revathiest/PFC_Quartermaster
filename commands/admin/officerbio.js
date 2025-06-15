const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { OfficerBio } = require('../../config/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('officerbio')
    .setDescription('Set your officer bio')
    .addStringOption(option =>
      option.setName('bio')
        .setDescription('Your bio')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  help: 'Allows officers to set their bio for the public officer listing. Requires Kick Members permission.',
  category: 'Admin',
  async execute(interaction) {
    const bio = interaction.options.getString('bio');
    try {
      await OfficerBio.upsert({ discordUserId: interaction.user.id, bio });
      await interaction.reply({ content: '✅ Bio saved.', flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('Failed to save officer bio:', err);
      await interaction.reply({ content: '❌ Error saving bio.', flags: MessageFlags.Ephemeral });
    }
  }
};
