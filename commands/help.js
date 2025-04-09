const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

const Builder = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Displays a categorized list of all commands and what they do');

module.exports = {
  data: Builder,

  async execute(interaction, client) {
    const commands = client.commands;

    // Group commands by category
    const categories = {};

    for (const command of commands.values()) {
      const category = command.category || 'Uncategorized';
      const helpText = command.help || 'No description provided.';

      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push({
        name: `/${command.data.name}`,
        value: helpText
      });
    }

    // Build embed
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📘 Quartermaster Command Help')
      .setDescription('Here’s what I can do, sorted by category.')
      .setFooter({ text: 'Use /help anytime to see this again.' })
      .setTimestamp();

    // Add commands grouped by category
    for (const [category, cmds] of Object.entries(categories)) {
      const fieldValue = cmds.map(cmd => `**${cmd.name}**: ${cmd.value}`).join('\n');
      embed.addFields({ name: `📂 ${category}`, value: fieldValue });
    }

    // Send ephemeral response in current channel
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
