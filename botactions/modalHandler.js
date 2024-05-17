const { saveAnnouncementToDatabase } = require('./scheduleHandler');
const moment = require('moment');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;

        if (interaction.customId === 'scheduleModal') {
            const channelId = interaction.fields.getTextInputValue('channel');
            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const color = interaction.fields.getTextInputValue('color') || '#0099ff';
            const author = interaction.fields.getTextInputValue('author') || 'Official PFC Communication';
            const footer = interaction.fields.getTextInputValue('footer') || 'Official PFC Communication';
            const time = interaction.fields.getTextInputValue('time');

            // Validate the time format
            if (!moment(time, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
                await interaction.reply({ content: 'Invalid time format. Please use YYYY-MM-DD HH:mm:ss', ephemeral: true });
                return;
            }

            // Save the announcement to the database
            const embedData = { title, description, color, author, footer };
            await saveAnnouncementToDatabase(channelId, embedData, time);

            await interaction.reply({ content: `Announcement scheduled for ${time} in channel ${channelId}`, ephemeral: true });
        }
    },
};
