const { SlashCommandBuilder } = require('discord.js');
const { VerifiedUser, OrgTag } = require('../../config/database'); // Adjust path if needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('override-tag')
    .setDescription('Manually override a user’s org tag.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The Discord user to override')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tag')
        .setDescription('The tag to assign')
        .setRequired(true)
        // Choices will be injected dynamically later if needed
    ),
    help: 'Manually override a user’s org tag for nickname formatting. (Admin Only)',
    category: 'Admin',
    
    async execute(interaction) {
        const adminMember = interaction.member;
        if (!adminMember.permissions.has('Administrator')) {
          return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
      
        const targetUser = interaction.options.getUser('user');
        const selectedTag = interaction.options.getString('tag');
      
        const knownTags = await OrgTag.findAll();
        const knownTagList = knownTags.map(t => t.tag.toUpperCase());
      
        if (!knownTagList.includes(selectedTag.toUpperCase())) {
          return interaction.reply({ content: `❌ Invalid tag. Please select a valid org tag.`, ephemeral: true });
        }
      
        const [record, created] = await VerifiedUser.findOrCreate({
          where: { discordUserId: targetUser.id },
          defaults: {
            rsiHandle: targetUser.username,
            rsiOrgId: null,
            verifiedAt: new Date(),
            manualTagOverride: selectedTag,
          },
        });
      
        if (!created) {
          await record.update({ manualTagOverride: selectedTag });
        }
      
        // 🛠️ Immediately enforce nickname update
        const guild = interaction.guild;
        const member = await guild.members.fetch(targetUser.id);
        const { evaluateAndFixNickname } = require('../../utils/evaluateAndFixNickname'); // Adjust path if needed
      
        await evaluateAndFixNickname(member, { skipPending: false });
      
        await interaction.reply({
          content: `✅ Tag override applied: **${targetUser.username}** is now set to **[${selectedTag}]** and nickname updated.`,
          ephemeral: true,
        });
      }      
};
