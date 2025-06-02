const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { Hunt } = require('../../config/database');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('List all scavenger hunts'),

  async execute(interaction) {
    try {
      const hunts = await Hunt.findAll({ order: [['starts_at', 'DESC']] });
      if (!hunts.length) {
        return interaction.reply({ content: '❌ No scavenger hunts found.', flags: MessageFlags.Ephemeral });
      }

      const embed = new EmbedBuilder().setTitle('Scavenger Hunts');
      for (const h of hunts) {
        const start = h.starts_at ? new Date(h.starts_at).toLocaleString() : 'N/A';
        const end = h.ends_at ? new Date(h.ends_at).toLocaleString() : 'N/A';
        embed.addFields({ name: `${h.name} (${h.status})`, value: `${start} → ${end}` });
      }

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to fetch hunts:', err);
      await interaction.reply({ content: '❌ Error fetching hunts.', flags: MessageFlags.Ephemeral });
    }
  }
};
