const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const jwt = require('jsonwebtoken');
const { isAdmin } = require('../../botactions/userManagement/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apitoken')
    .setDescription('Generate a JWT for API testing (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  help: 'Generates a JWT for API testing. Only administrators may use this command.',
  category: 'Admin',
  async execute(interaction) {
    if (!isAdmin(interaction)) {
      return interaction.reply({
        content: '❌ You do not have permission to run this command.',
        flags: MessageFlags.Ephemeral
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('❌ JWT_SECRET not configured');
      return interaction.reply({
        content: '❌ Server misconfiguration.',
        flags: MessageFlags.Ephemeral
      });
    }

    const member = interaction.member || await interaction.guild.members.fetch(interaction.user.id);
    const roles = member.roles?.cache?.map(r => r.name) || [];
    const payload = {
      id: interaction.user.id,
      username: interaction.user.username,
      displayName: member.displayName,
      roles
    };
    const token = jwt.sign(payload, secret, { expiresIn: '30m' });

    await interaction.reply({
      content: `Bearer ${token}`,
      flags: MessageFlags.Ephemeral
    });
  }
};
