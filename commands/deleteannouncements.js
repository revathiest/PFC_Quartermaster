const { SlashCommandBuilder } = require('discord.js');
const { deleteScheduledAnnouncement } = require('../botactions/scheduling/scheduleHandler');

const allowedRoles = ['Admiral', 'Fleet Admiral'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteannouncement')
        .setDescription('Delete a scheduled announcement')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The ID of the announcement to delete')
                .setRequired(true)),
    help: 'Deletes a scheduled announcement by its ID. Only available to Admirals and Fleet Admirals.',
    async execute(interaction) {
        const memberRoles = interaction.member.roles.cache.map(role => role.name);
        if (!allowedRoles.some(role => memberRoles.includes(role))) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const id = interaction.options.getString('id');
        const success = await deleteScheduledAnnouncement(id);

        if (success) {
            await interaction.reply(`Announcement with ID ${id} has been deleted.`);
        } else {
            await interaction.reply(`Announcement with ID ${id} was not found.`);
        }
    },
};
