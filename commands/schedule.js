const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedules an announcement as an embed'),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('scheduleModal')
            .setTitle('Schedule Announcement');

        const channelInput = new TextInputBuilder()
            .setCustomId('channel')
            .setLabel('Channel ID')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the channel ID')
            .setRequired(true);

        const titleInput = new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Embed Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the embed title')
            .setRequired(true);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Embed Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter the embed description')
            .setRequired(true);

        const colorInput = new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Embed Color (Hex)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#0099ff')
            .setRequired(false);

        const authorInput = new TextInputBuilder()
            .setCustomId('author')
            .setLabel('Author')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Author name')
            .setRequired(false);

        const footerInput = new TextInputBuilder()
            .setCustomId('footer')
            .setLabel('Footer')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Footer text')
            .setRequired(false);

        const timeInput = new TextInputBuilder()
            .setCustomId('time')
            .setLabel('Schedule Time (YYYY-MM-DD HH:mm:ss)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the time')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(channelInput),
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(authorInput),
            new ActionRowBuilder().addComponents(footerInput),
            new ActionRowBuilder().addComponents(timeInput)
        );

        await interaction.showModal(modal);
    },
};
