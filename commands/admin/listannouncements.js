const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getScheduledAnnouncements } = require('../../botactions/scheduling/scheduleHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listannouncements')
        .setDescription('List all scheduled announcements')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    help: 'Lists all snap channels configured for automatic purge. (Admin Only)',
    category: 'Discord',        
    async execute(interaction) {

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
