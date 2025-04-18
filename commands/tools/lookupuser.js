const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

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
    help: 'Fetches a user’s display name and tag using their Discord ID. Useful for admin lookups. (Admin Only)',
    category: 'Admin',
    
  async execute(interaction) {
    const userId = interaction.options.getString('userid');

    try {
      // Try to fetch member from the guild
      const member = await interaction.guild.members.fetch(userId);
      const displayName = member.displayName;
      const tag = member.user.tag;

      await interaction.reply({
        content: `🕵️‍♂️ **User ID**: \`${userId}\`\n🏷️ **Display Name**: \`${displayName}\`\n👤 **Tag**: \`${tag}\``,
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
        console.warn(`User ${userId} not found in this server — using global profile.`);

      // Fallback to global user lookup if not in guild
      try {
        const user = await interaction.client.users.fetch(userId);
        await interaction.reply({
          content: `⚠️ User not found in this server.\n🕵️‍♂️ **User ID**: \`${user.id}\`\n👤 **Username**: \`${user.tag}\``,
          flags: MessageFlags.Ephemeral
        });
      } catch (fallbackError) {
        console.error(`Also failed to fetch global user ${userId}:`, fallbackError);
        await interaction.reply({
          content: `❌ Couldn't fetch user with ID \`${userId}\`.`,
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }
};
