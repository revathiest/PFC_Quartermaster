const { SlashCommandSubcommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const { Hunt } = require('../../config/database');
const chrono = require('chrono-node');

module.exports = {
  data: () => new SlashCommandSubcommandBuilder()
    .setName('schedule')
    .setDescription('Schedule a new scavenger hunt')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Hunt name').setRequired(true))
    .addStringOption(opt =>
      opt.setName('start').setDescription('Start time').setRequired(true))
    .addStringOption(opt =>
      opt.setName('end').setDescription('End time').setRequired(true))
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Event voice channel')
        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('description').setDescription('Hunt description').setRequired(false)),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const startInput = interaction.options.getString('start');
    const endInput = interaction.options.getString('end');
    const channel = interaction.options.getChannel('channel');

    const start = chrono.parseDate(startInput);
    const end = chrono.parseDate(endInput);

    if (!start || !end || isNaN(start) || isNaN(end) || end <= start) {
      return interaction.reply({ content: '❌ Invalid start or end time.', flags: MessageFlags.Ephemeral });
    }

    try {
      const event = await interaction.guild.scheduledEvents.create({
        name,
        description,
        scheduledStartTime: start,
        scheduledEndTime: end,
        privacyLevel: 2, // GuildOnly
        entityType: 2, // Voice
        channel,
      });

      await Hunt.create({
        name,
        description,
        discord_event_id: event.id,
        starts_at: start,
        ends_at: end,
        status: 'upcoming',
      });

      await interaction.reply({ content: `✅ Hunt "${name}" scheduled.`, flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('❌ Failed to schedule hunt:', err);
      await interaction.reply({ content: '❌ Failed to schedule hunt.', flags: MessageFlags.Ephemeral });
    }
  }
};
