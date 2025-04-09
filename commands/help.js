const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

const Builder = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Displays a categorized list of available commands');

module.exports = {
  data: Builder,

  async execute(interaction, client) {
    const userPerms = interaction.member.permissions;
    const commands = client.commands;

    const categories = {};

    for (const command of commands.values()) {
      const permBitfield = command.data.default_member_permissions;

      // Filter out commands the user doesn’t have permission to use
      if (
        permBitfield &&
        !userPerms.has(PermissionsBitField.resolve(permBitfield))
      ) {
        continue; // Skip this command
      }

      const category = command.category || 'Uncategorized';
      const helpText = command.help || 'No description provided.';

      if (!categories[category]) categories[category] = [];
      categories[category].push(`**/${command.data.name}**: ${helpText}`);
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📘 Quartermaster Command Help')
      .setDescription('These are the commands you currently have access to.')
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

    if (embed.fields.length === 0) {
      embed.setDescription('You don’t currently have access to any commands.');
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
