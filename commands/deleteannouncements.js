const { SlashCommandBuilder } = require('discord.js');
const { deleteScheduledAnnouncement } = require('../botactions/announcementScheduler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteannouncement')
        .setDescription('Delete a scheduled announcement')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The ID of the announcement to delete')
                .setRequired(true)),
    async execute(interaction) {
        const id = interaction.options.getString('id');
        const success = await deleteScheduledAnnouncement(id);

        if (success) {
            await interaction.reply(`Announcement with ID ${id} has been deleted.`);
        } else {
            await interaction.reply(`Announcement with ID ${id} was not found.`);
        }
    },
};
