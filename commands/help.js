const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

const Builder = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Displays a categorized list of all commands and what they do');

module.exports = {
  data: Builder,

  async execute(interaction, client) {
    const commands = client.commands;
    const categories = {};

    for (const command of commands.values()) {
      const category = command.category || 'Uncategorized';
      const helpText = command.help || 'No description provided.';

      if (!categories[category]) categories[category] = [];

      categories[category].push(`**/${command.data.name}**: ${helpText}`);
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📘 Quartermaster Command Help')
      .setDescription('Here’s what I can do, sorted by category.')
      .setFooter({ text: 'Use /help anytime to see this again.' })
      .setTimestamp();

    for (const [category, entries] of Object.entries(categories)) {
      let chunk = '';
      for (const line of entries) {
        if ((chunk + line + '\n').length > 1024) {
          embed.addFields({ name: `📂 ${category}`, value: chunk });
          chunk = '';
        }
        chunk += `${line}\n`;
      }
      if (chunk.length > 0) {
        embed.addFields({ name: `📂 ${category}`, value: chunk });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
