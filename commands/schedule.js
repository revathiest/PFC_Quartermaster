const { SlashCommandBuilder } = require('@discordjs/builders');
const { saveAnnouncementToDatabase } = require('../botactions/scheduleHandler');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedules an announcement')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send the announcement to')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('time')
                .setDescription('The time to send the message (YYYY-MM-DD HH:mm:ss)')
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');
        const time = interaction.options.getString('time');

        // Validate the time format
        if (!moment(time, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
            await interaction.reply('Invalid time format. Please use YYYY-MM-DD HH:mm:ss');
            return;
        }

        // Save the announcement to the database using the channel ID
        await saveAnnouncementToDatabase(channel.id, message, time);

        await interaction.reply(`Announcement scheduled for ${time} in channel ${channel.name}`);
    },
};
