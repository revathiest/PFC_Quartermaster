const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { VerifiedUser } = require('../../config/database');
const { fetchRsiProfileInfo } = require('../../utils/rsiProfileScraper');

function isValidHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname && parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Look up RSI profile info for a verified user.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to look up')
        .setRequired(true)
    ),
  help: 'Provides RSI profile details for a verified user.',
  category: 'User',

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const targetMember = interaction.guild.members.cache.get(targetUser.id);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const verified = await VerifiedUser.findByPk(targetUser.id);
    if (!verified) {
      return interaction.editReply({
        content: `❌ ${targetUser.tag} has not verified their RSI profile.`,
      });
    }

    try {
      const profile = await fetchRsiProfileInfo(verified.rsiHandle);
      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(profile.handle)
        .setURL(`https://robertsspaceindustries.com/citizens/${verified.rsiHandle}`)
        .setDescription(profile.bio || 'No bio provided.')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      if (isValidHttpsUrl(profile.avatar)) {
        embed.setThumbnail(profile.avatar);
      }
      
      const fields = [];
      if (profile.enlisted) fields.push({ name: 'Enlisted', value: profile.enlisted, inline: true });
      if (profile.orgName) fields.push({ name: 'Organization', value: profile.orgName, inline: true });
      if (profile.orgRank) fields.push({ name: 'Rank', value: profile.orgRank, inline: true });
      if (profile.orgId) fields.push({ name: 'SID', value: profile.orgId, inline: true });

      if (fields.length) {
        embed.addFields(fields);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(`[WHOIS ERROR]`, err);
      await interaction.editReply({
        content: '❌ Failed to fetch RSI profile details. Please try again later.',
      });
    }
  },
};
