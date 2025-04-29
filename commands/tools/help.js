// commands/help.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  PermissionsBitField,
  MessageFlags
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a categorized help menu with interactive options')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages),

  category: 'System',
  help: 'Displays available commands you have access to.',

  async execute(interaction, client) {
    const userPerms = interaction.member.permissions;
    const commands = client.commands;

    const categories = {};

    for (const command of commands.values()) {
      const permBitfield = command.data.default_member_permissions;
      if (permBitfield && !userPerms.has(PermissionsBitField.resolve(permBitfield))) continue;
      if (!command.help || typeof command.help !== 'string') continue;

      const category = command.category || 'Uncategorized';
      if (!categories[category]) categories[category] = [];

      categories[category].push(`**/${command.data.name}**: ${command.help}`);
    }

    const categoryOptions = Object.keys(categories).map((cat) => ({
      label: cat,
      value: cat,
      description: `View commands in ${cat}`,
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('helpCategorySelect')
      .setPlaceholder('Select a command category')
      .addOptions(categoryOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📘 Quartermaster Command Help')
      .setDescription('Select a category below to view available commands.')
      .setFooter({ text: 'Use the menu to browse categories. Escape or click away to exit.' })
      .setTimestamp();

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const reply = await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 5 * 60 * 1000,
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'This menu isn’t for you.', flags: MessageFlags.Ephemeral });
      }

      const selectedCategory = i.values[0];
      const commandsList = categories[selectedCategory];

      const categoryEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📂 ${selectedCategory} Commands`)
        .setDescription(commandsList.join('\n'))
        .setFooter({ text: 'Use the menu to switch categories. Escape or click away to exit.' })
        .setTimestamp();

      await i.update({ embeds: [categoryEmbed], components: [row] });
    });

    collector.on('end', async () => {
      if (!reply || reply.deleted || !reply.editable) {
        console.warn('⚠️ Help menu message no longer exists. Skipping disable.');
        return;
      }

      try {
        await reply.edit({ components: [] });
      } catch (err) {
        if (err.code === 10008) {
          console.warn('⚠️ Tried to edit help menu but it was already deleted.');
        } else {
          console.error('❌ Failed to disable help menu:', err);
        }
      }
    });
  },

  option: async (interaction) => {
    if (interaction.customId === 'helpCategorySelect') return;
  },
};