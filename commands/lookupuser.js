const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookupuser')
    .setDescription('Fetch a Discord username by user ID (admin only)')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('The Discord user ID to look up')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');

    try {
      const user = await interaction.client.users.fetch(userId);
      await interaction.reply(`🕵️‍♂️ **User ID**: \`${user.id}\`\n👤 **Username**: \`${user.tag}\``);
    } catch (error) {
      console.error(`Failed to fetch user: ${error}`);
      await interaction.reply({ content: `❌ Couldn't fetch user with ID \`${userId}\`.`, ephemeral: true });
    }
  }
};
