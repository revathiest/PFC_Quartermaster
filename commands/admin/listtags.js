const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { OrgTag } = require('../../config/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listtags')
    .setDescription('Lists all configured organization tags.')
    .setDefaultMemberPermissions(0) // Admin-only; adjust if needed,
    .setDMPermission(false),

  help: 'Lists all organization tags that are currently defined.',
  category: 'Admin',

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const tags = await OrgTag.findAll();

      if (tags.length === 0) {
        return interaction.editReply('❌ No organization tags are currently defined.');
      }

      const tagList = tags
        .map(tag => `• **${tag.tag}** (Org ID: \`${tag.rsiOrgId}\`)`)
        .join('\n');

      await interaction.editReply({
        content: `🏷️ **Defined Organization Tags:**\n${tagList}`,
      });

    } catch (error) {
      console.error('[LISTTAGS] Error fetching tags:', error);
      await interaction.editReply('❌ Something went wrong while fetching org tags.');
    }
  },
};
