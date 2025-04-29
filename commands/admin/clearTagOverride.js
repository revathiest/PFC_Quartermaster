const { SlashCommandBuilder } = require('discord.js');
const { VerifiedUser } = require('../../config/database');
const { evaluateAndFixNickname } = require('../../utils/evaluateAndFixNickname');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-tag-override')
    .setDescription('Remove a manual tag override for a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The Discord user to clear the override for.')
        .setRequired(true)
    ),
  
  help: 'Remove a manual tag override and revert a user to normal org tag handling. (Admin Only)',
  category: 'Admin',

  async execute(interaction) {
    const adminMember = interaction.member;
    if (!adminMember.permissions.has('Administrator')) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const guild = interaction.guild;

    const verifiedRecord = await VerifiedUser.findByPk(targetUser.id);

    if (!verifiedRecord || !verifiedRecord.manualTagOverride) {
      return interaction.reply({
        content: `❌ No manual override found for **${targetUser.username}**.`,
        ephemeral: true,
      });
    }

    await verifiedRecord.update({ manualTagOverride: null });

    const member = await guild.members.fetch(targetUser.id);
    await evaluateAndFixNickname(member, { skipPending: false });

    await interaction.reply({
      content: `✅ Tag override cleared for **${targetUser.username}** and nickname updated.`,
      ephemeral: true,
    });
  }
};
