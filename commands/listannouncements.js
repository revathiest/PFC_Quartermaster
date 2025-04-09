const { SlashCommandBuilder } = require('discord.js');
const { getScheduledAnnouncements } = require('../botactions/scheduling/scheduleHandler');

const allowedRoles = ['Admiral', 'Fleet Admiral'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listannouncements')
        .setDescription('List all scheduled announcements'),help: 'Lists all snap channels configured for automatic purge.'
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    category: 'Admin',        
    async execute(interaction) {
        const memberRoles = interaction.member.roles.cache.map(role => role.name);
        if (!allowedRoles.some(role => memberRoles.includes(role))) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const announcements = await getScheduledAnnouncements();
        if (!announcements.length) {
            await interaction.reply('There are no scheduled announcements.');
            return;
        }

        let reply = 'Scheduled Announcements:\n';
        announcements.forEach((ann, index) => {
            const embedData = JSON.parse(ann.embedData); // Parse the embed data
            reply += `${index + 1}. ID: ${ann.id}, Title: ${embedData.title}, Time: ${ann.time}\n`;
        });

        await interaction.reply(reply);
    },
};
