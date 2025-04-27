const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { VerifiedUser } = require('../config/database'); // Adjust if your path differs
const scrapeOrgMembers = require('../utils/rsiScrapeOrgMembers'); // Assuming you’ve got this
const getGuildMembersWithRoles = require('../utils/getGuildMembersWithRoles'); // You may need to make this

module.exports = {
  data: new SlashCommandBuilder()
    .setName('orgstatus')
    .setDescription('Compare RSI org members with verified Discord members and generate a report.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('report')
        .setDescription('Generate the org membership discrepancy report')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  botPermsReq: ['SendMessages', 'EmbedLinks'],
  async execute(interaction) {
    const guild = interaction.guild;
    const orgId = 'PFCS'; // Replace with your actual org ID

    await interaction.deferReply();

    // Step 1: Scrape RSI Org Members
    const rsiMembers = await scrapeOrgMembers(orgId); 
    const rsiHandles = rsiMembers.map(m => m.handle.toLowerCase());

    // Step 2: Get Verified Users from DB
    const verifiedUsers = await VerifiedUser.findAll({ where: { rsiOrgId: orgId } });
    const verifiedHandles = verifiedUsers.map(v => v.rsiHandle.toLowerCase());

    // Step 3: Get Discord Members with Target Roles
    const targetRoles = ['Recruit', 'Ensign', 'Lieutenant'];
    const roleMembers = await getGuildMembersWithRoles(guild, targetRoles);
    const roleMemberIds = roleMembers.map(m => m.id);

    // Step 4: Matchups and Discrepancy Detection
    const verifiedDiscordIds = verifiedUsers.map(v => v.discordUserId);

    const unverifiedRoleMembers = roleMembers.filter(m => !verifiedDiscordIds.includes(m.id));
    const rsiOnlyHandles = rsiHandles.filter(handle => !verifiedHandles.includes(handle));

    // Step 5: Build Report Embed
    const { EmbedBuilder } = require('discord.js');
    const reportEmbed = new EmbedBuilder()
      .setTitle('Org Membership Verification Report')
      .setColor(0x3498db)
      .addFields(
        { name: 'RSI Org Total Members', value: `${rsiHandles.length}`, inline: true },
        { name: 'Discord Members with Roles', value: `${roleMembers.length}`, inline: true },
        { name: 'Verified Matches', value: `${verifiedUsers.filter(v => roleMemberIds.includes(v.discordUserId)).length}`, inline: true },
        { name: 'Unverified in Discord (with role)', value: `${unverifiedRoleMembers.length}`, inline: true },
        { name: 'In RSI Org but Not Verified', value: `${rsiOnlyHandles.length}`, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [reportEmbed] });
  }
};
