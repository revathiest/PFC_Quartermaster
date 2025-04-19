const { SlashCommandBuilder } = require('discord.js');
const { AmbientMessage } = require('../../config/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ambient')
    .setDescription('Manage ambient messages')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a new ambient message')
        .addStringOption(opt =>
          opt.setName('content')
            .setDescription('Message content')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('tag')
            .setDescription('Optional tag for grouping')
            .setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all ambient messages')
    )
    .addSubcommand(sub =>
      sub.setName('edit')
        .setDescription('Edit an existing message')
        .addIntegerOption(opt =>
          opt.setName('id')
            .setDescription('ID of the message to edit')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('content')
            .setDescription('New content')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a message by ID')
        .addIntegerOption(opt =>
          opt.setName('id')
            .setDescription('ID of the message to delete')
            .setRequired(true))
    ),

  help: 'Manage the pool of ambient messages the bot can use to enhance active channels.',
  category: 'Tools',

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const content = interaction.options.getString('content');
      const tag = interaction.options.getString('tag');

      try {
        const newMessage = await AmbientMessage.create({ content, tag });
        await interaction.reply(`✅ Ambient message added with ID \`${newMessage.id}\``);
      } catch (err) {
        console.error('❌ Error adding ambient message:', err);
        await interaction.reply('❌ Failed to add ambient message.');
      }

    } else if (sub === 'list') {
      try {
        const messages = await AmbientMessage.findAll();
        if (!messages.length) {
          return interaction.reply('⚠️ No ambient messages found.');
        }

        const list = messages.map(msg => `• [${msg.id}] ${msg.content}${msg.tag ? ` _(tag: ${msg.tag})_` : ''}`);
        const chunk = list.join('\n').slice(0, 2000); // keep under Discord's message limit
        await interaction.reply(`🗃️ Ambient Messages:\n\n${chunk}`);
      } catch (err) {
        console.error('❌ Error listing ambient messages:', err);
        await interaction.reply('❌ Failed to list ambient messages.');
      }

    } else if (sub === 'edit') {
      const id = interaction.options.getInteger('id');
      const content = interaction.options.getString('content');

      try {
        const message = await AmbientMessage.findByPk(id);
        if (!message) return interaction.reply('⚠️ No message found with that ID.');

        await message.update({ content });
        await interaction.reply(`✏️ Ambient message \`${id}\` updated.`);
      } catch (err) {
        console.error('❌ Error editing ambient message:', err);
        await interaction.reply('❌ Failed to edit ambient message.');
      }

    } else if (sub === 'delete') {
      const id = interaction.options.getInteger('id');

      try {
        const message = await AmbientMessage.findByPk(id);
        if (!message) return interaction.reply('⚠️ No message found with that ID.');

        await message.destroy();
        await interaction.reply(`🗑️ Ambient message \`${id}\` deleted.`);
      } catch (err) {
        console.error('❌ Error deleting ambient message:', err);
        await interaction.reply('❌ Failed to delete ambient message.');
      }
    }
  }
};
