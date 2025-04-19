const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { fetchRsiProfileInfo } = require('../../utils/rsiProfileScraper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scrape-profile')
    .setDescription('Scrape an RSI profile for bio and org ID (admin only).')
    .addStringOption(option =>
      option.setName('rsi_handle')
        .setDescription('The RSI handle to look up.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  help: 'Utility command to scrape profile info from the RSI site for a given user',
  category: 'Admin',

  async execute(interaction) {
    const rsiHandle = interaction.options.getString('rsi_handle');

    try {
      const { bio, orgId } = await fetchRsiProfileInfo(rsiHandle);

      await interaction.reply({
        content: [
          `🔍 **Profile info for** \`${rsiHandle}\`:`,
          `> 🧠 **Bio:** ${bio ? bio : '_[No bio found]_'}`,
          `> 🏷️ **Org ID:** ${orgId ? orgId : '_[None found]_'}`,
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });

    } catch (err) {
      console.error(`Error scraping profile for ${rsiHandle}:`, err.message);
      await interaction.reply({
        content: `❌ Failed to fetch profile for \`${rsiHandle}\`. Check the name and try again.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
