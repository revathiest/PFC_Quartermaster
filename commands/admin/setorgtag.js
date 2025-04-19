// commands/admin/setOrgTag.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { OrgTag } = require('../../config/database'); // Sequelize model you created

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-org-tag')
    .setDescription('Link an RSI org ID to a Discord tag.')
    .addStringOption(option =>
      option.setName('rsi_org_id')
        .setDescription('The RSI org ID from the org URL (e.g. pyrofreelancercorps)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tag')
        .setDescription('The nickname tag to use, e.g. "PFC"')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  help: 'Links an RSI organization ID to a Discord nickname tag. Used to automatically tag users during verification based on their org membership (e.g. [PFC]).',
  category: 'Admin',

  async execute(interaction) {
    const rsiOrgId = interaction.options.getString('rsi_org_id').toUpperCase();
    const tag = interaction.options.getString('tag').toUpperCase();

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ Only administrators can use this command.',
          flags: MessageFlags.Ephemeral
        });
      }      

    try {
      await OrgTag.upsert({
        rsiOrgId,
        tag
      });

      await interaction.reply({
        content: `✅ Mapped RSI org \`${rsiOrgId}\` to tag \`[${tag}]\`.`,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error('Error saving org tag:', error);
      await interaction.reply({
        content: `❌ Something went wrong while saving that tag. Try again later.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
