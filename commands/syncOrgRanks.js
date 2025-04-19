// commands/admin/sync-org-ranks.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { VerifiedUser } = require('../config/database');
const { fetchRsiProfileInfo } = require('../utils/rsiProfileScraper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sync-org-ranks')
    .setDescription('Compare RSI org ranks with Discord roles for verified PFCS members.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  help: 'Checks all verified PFCS members and compares their RSI org rank with their current Discord roles. Flags mismatches so admins can correct them.',
  category: 'Admin',

  async execute(interaction) {
    await interaction.deferReply({ flags: 1 << 6 }); // ephemeral

    const guild = interaction.guild;
    const pfcsMembers = await VerifiedUser.findAll({ where: { rsiOrgId: 'PFCS' } });

    if (!pfcsMembers.length) {
      return interaction.editReply('No verified PFCS members found.');
    }

    const roleMismatchReports = [];

    for (const user of pfcsMembers) {

      const discordMember = await guild.members.fetch(user.discordUserId).catch(err => {
        console.warn(`[SYNC] Failed to fetch Discord member for ${user.discordUserId}: ${err.message}`);
        return null;
      });
      if (!discordMember) continue;

      let orgId, orgRank;
      try {
        const profile = await fetchRsiProfileInfo(user.rsiHandle);
        orgId = profile.orgId;
        orgRank = profile.orgRank;
      } catch (err) {
        console.warn(`[SYNC] Failed to fetch RSI profile for ${user.rsiHandle}: ${err.message}`);
        continue;
      }

      if (!orgRank) {
        console.warn(`[SYNC] No rank found for ${user.rsiHandle}`);
        continue;
      }

      const normalizedRank = orgRank.trim().toLowerCase();
      const roleNames = discordMember.roles.cache.map(role => role.name.trim().toLowerCase());
      
      const hasMatchingRole = roleNames.includes(normalizedRank);
      

      if (!hasMatchingRole) {
        roleMismatchReports.push(`❌ ${user.rsiHandle} (${discordMember.user.tag}) is ranked **${orgRank}** on RSI, but doesn't have that role.`);
      } else {
      }
    }

    const reply = roleMismatchReports.length
      ? roleMismatchReports.join('\n').slice(0, 2000)
      : '✅ All verified PFCS members have roles matching their RSI org rank.';

    await interaction.editReply(reply);
  }
};
