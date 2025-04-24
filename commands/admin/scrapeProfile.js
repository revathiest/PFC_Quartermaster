const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { fetchRsiProfileInfo } = require('../../utils/rsiProfileScraper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scrape-profile')
    .setDescription('Scrape an RSI profile for bio, org info, and avatar (admin only).')
    .addStringOption(option =>
      option.setName('rsi_handle')
        .setDescription('The RSI handle to look up (case-sensitive).')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  help: 'Utility command to scrape full profile info from the RSI site for a given user.',
  category: 'Admin',

  async execute(interaction) {
    const rsiHandle = interaction.options.getString('rsi_handle');

    try {
      const { handle, bio, enlisted, avatar, orgRank, orgName, orgId } = await fetchRsiProfileInfo(rsiHandle);

      const embed = {
        title: `RSI Profile: ${handle}`,
        thumbnail: avatar ? { url: avatar } : undefined,
        fields: [
          { name: 'Enlisted', value: enlisted || 'N/A', inline: true },
          { name: 'Organization', value: orgName || 'N/A', inline: true },
          { name: 'Org Rank', value: orgRank || 'N/A', inline: true },
          { name: 'Org Tag', value: orgId || 'N/A', inline: true},
          { name: 'Bio', value: bio || 'No bio provided.' }
        ],
        color: 0x00AEEF,
        footer: { text: 'Scraped directly from RSI public profile' }
      };

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (err) {
      console.error(`[SCRAPE PROFILE] Error scraping profile for ${rsiHandle}:`, err.message);
      await interaction.reply({
        content: `❌ Failed to fetch profile for \`${rsiHandle}\`. Check the handle and try again.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};