const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { AmbientMessage, AmbientChannel, AmbientSetting } = require('../../config/database');

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
    )
    .addSubcommand(sub =>
      sub.setName('allowchannel')
        .setDescription('Allow ambient messages in a channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel to allow ambient messages')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('disallowchannel')
        .setDescription('Disallow ambient messages in a channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel to disallow ambient messages')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('listchannels')
        .setDescription('List all allowed ambient message channels')
    )
    .addSubcommand(sub =>
      sub.setName('config')
        .setDescription('Configure ambient message thresholds')
        .addIntegerOption(opt =>
          opt.setName('minmessages')
            .setDescription('Minimum messages since last bot post (e.g. 5)')
            .setRequired(false))
        .addIntegerOption(opt =>
          opt.setName('freshwindow')
            .setDescription('Fresh window in minutes')
            .setRequired(false))
    )    
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  help: 'Manage the pool of ambient messages the bot can use to enhance active channels.',
  category: 'Tools',

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

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
        if (!messages.length) return interaction.reply('⚠️ No ambient messages found.');

        const list = messages.map(msg => `• [${msg.id}] ${msg.content}${msg.tag ? ` _(tag: ${msg.tag})_` : ''}`);
        const chunk = list.join('\n').slice(0, 2000);
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

    } else if (sub === 'allowchannel') {
      const channel = interaction.options.getChannel('channel');

      try {
        const [entry, created] = await AmbientChannel.findOrCreate({
          where: { guildId, channelId: channel.id }
        });

        if (created) {
          await interaction.reply(`✅ Ambient messages **enabled** in <#${channel.id}>.`);
        } else {
          await interaction.reply(`ℹ️ Ambient messages were already enabled in <#${channel.id}>.`);
        }
      } catch (err) {
        console.error('❌ Error allowing channel:', err);
        await interaction.reply('❌ Failed to allow ambient messages in that channel.');
      }

    } else if (sub === 'disallowchannel') {
      const channel = interaction.options.getChannel('channel');

      try {
        const removed = await AmbientChannel.destroy({
          where: { guildId, channelId: channel.id }
        });

        if (removed) {
          await interaction.reply(`🚫 Ambient messages **disabled** in <#${channel.id}>.`);
        } else {
          await interaction.reply(`ℹ️ Ambient messages weren’t active in <#${channel.id}>.`);
        }
      } catch (err) {
        console.error('❌ Error disallowing channel:', err);
        await interaction.reply('❌ Failed to disallow ambient messages in that channel.');
      }

    } else if (sub === 'listchannels') {
      try {
        const entries = await AmbientChannel.findAll({ where: { guildId } });
        if (!entries.length) {
          return interaction.reply('📭 No channels currently allow ambient messages.');
        }

        const list = entries.map(row => `<#${row.channelId}>`).join('\n');
        await interaction.reply(`📢 Ambient messages are currently allowed in:\n${list}`);
      } catch (err) {
        console.error('❌ Error listing ambient channels:', err);
        await interaction.reply('❌ Failed to list allowed channels.');
      }
    } else if (sub === 'config') {
      const guildId = interaction.guild.id;
      const minMessages = interaction.options.getInteger('minmessages');
      const freshWindowMin = interaction.options.getInteger('freshwindow'); // ✅ properly declared
    
      if (minMessages === null && freshWindowMin === null) {
        return interaction.reply({
          content: '⚠️ You must provide at least one setting to update.',
          flags: MessageFlags.Ephemeral
        });
      }
    
      const freshWindowMs = freshWindowMin != null ? freshWindowMin * 60 * 1000 : null;
    
      try {
        const [setting, created] = await AmbientSetting.findOrCreate({
          where: { guildId },
          defaults: {
            minMessagesSinceLast: minMessages ?? 5,
            freshWindowMs: freshWindowMs ?? 3 * 60 * 1000
          }
        });
    
        if (!created) {
          if (minMessages !== null) setting.minMessagesSinceLast = minMessages;
          if (freshWindowMs !== null) setting.freshWindowMs = freshWindowMs;
          await setting.save();
        }
    
        await interaction.reply(`🔧 Ambient config updated:\n• Minimum messages: \`${setting.minMessagesSinceLast}\`\n• Fresh window: \`${Math.floor(setting.freshWindowMs / 60000)} min\``);
      } catch (err) {
        console.error('❌ Error updating ambient config:', err);
        await interaction.reply('❌ Failed to update ambient settings.');
      }
    }
  }
};