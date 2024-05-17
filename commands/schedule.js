const { SlashCommandBuilder } = require('@discordjs/builders');
const { saveAnnouncementToDatabase } = require('../botactions/scheduleHandler');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedules an announcement as an embed')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send the announcement to')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('title')
                .setDescription('The title of the embed')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('description')
                .setDescription('The description of the embed')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('time')
                .setDescription('The time to send the message (YYYY-MM-DD HH:mm:ss)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('color')
                .setDescription('The color of the embed (in hex, e.g., #0099ff)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('author')
                .setDescription('The author of the embed')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('footer')
                .setDescription('The footer text of the embed')
                .setRequired(false)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || '#0099ff';
        const author = interaction.options.getString('author') || 'Official PFC Communication';
        const footer = interaction.options.getString('footer') || 'Official PFC Communication';
        const time = interaction.options.getString('time');

        // Validate the time format
        if (!moment(time, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
            await interaction.reply('Invalid time format. Please use YYYY-MM-DD HH:mm:ss');
            return;
        }

        // Save the announcement to the database using the channel ID
        const embedData = { title, description, color, author, footer };
        await saveAnnouncementToDatabase(channel.id, embedData, time);

        await interaction.reply(`Announcement scheduled for ${time} in channel ${channel.name}`);
    },
};
v