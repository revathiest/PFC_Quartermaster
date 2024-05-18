const { SlashCommandBuilder } = require('discord.js');
const { listScheduledAnnouncements } = require('../botactions/announcementScheduler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listannouncements')
        .setDescription('List all scheduled announcements'),
    async execute(interaction) {
        const announcements = await listScheduledAnnouncements();
        if (announcements.length === 0) {
            await interaction.reply('There are no scheduled announcements.');
            return;
        }

        let reply = 'Scheduled Announcements:\n';
        announcements.forEach((ann, index) => {
            reply += `${index + 1}. ID: ${ann.id}, Title: ${ann.title}, Time: ${ann.time}\n`;
        });

        await interaction.reply(reply);
    },
};
