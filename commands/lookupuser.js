const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookupuser')
    .setDescription('Fetch a Discord user\'s display name by user ID (admin only)')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('The Discord user ID to look up')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');

    try {
      // Try to fetch member from the guild
      const member = await interaction.guild.members.fetch(userId);
      const displayName = member.displayName;
      const tag = member.user.tag;

      await interaction.reply({
        content: `🕵️‍♂️ **User ID**: \`${userId}\`\n🏷️ **Display Name**: \`${displayName}\`\n👤 **Tag**: \`${tag}\``,
        ephemeral: true
      });

    } catch (error) {
      console.error(`Failed to fetch member ${userId}:`, error);

      // Fallback to global user lookup if not in guild
      try {
        const user = await interaction.client.users.fetch(userId);
        await interaction.reply({
          content: `⚠️ User not found in this server.\n🕵️‍♂️ **User ID**: \`${user.id}\`\n👤 **Username**: \`${user.tag}\``,
          ephemeral: true
        });
      } catch (fallbackError) {
        console.error(`Also failed to fetch global user ${userId}:`, fallbackError);
        await interaction.reply({
          content: `❌ Couldn't fetch user with ID \`${userId}\`.`,
          ephemeral: true
        });
      }
    }
  }
};
