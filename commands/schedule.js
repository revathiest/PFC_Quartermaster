const { SlashCommandBuilder } = require('@discordjs/builders');
const { saveAnnouncementToDatabase } = require('../botactions/scheduleHandler');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedules an announcement')
        .addStringOption(option => 
            option.setName('channel')
                .setDescription('The channel ID to send the announcement to')
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
        const channelId = interaction.options.getString('channel');
        const message = interaction.options.getString('message');
        const time = interaction.options.getString('time');

        // Validate the time format
        if (!moment(time, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
            await interaction.reply('Invalid time format. Please use YYYY-MM-DD HH:mm:ss');
            return;
        }

        // Save the announcement to the database
        await saveAnnouncementToDatabase(channelId, message, time);

        await interaction.reply(`Announcement scheduled for ${time} in channel ${channelId}`);
    },
};
