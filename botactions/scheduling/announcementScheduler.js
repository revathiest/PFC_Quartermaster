const { getScheduledAnnouncements, deleteScheduledAnnouncement } = require('./scheduleHandler');
const { EmbedBuilder } = require('discord.js');
const moment = require('moment');
const { getChannelNameById, getGuildNameById } = require('../utilityFunctions'); // Assume these utility functions exist

async function checkScheduledAnnouncements(client) {
    const announcements = await getScheduledAnnouncements();
    if (!Array.isArray(announcements)) {
        console.error('Scheduled announcements are not iterable:', announcements);
        return;
    }

    const now = moment();

    for (const announcement of announcements) {
        const announcementTime = moment(announcement.time, 'YYYY-MM-DD HH:mm:ss');
        console.log(`Announcement time: ${announcementTime.format('YYYY-MM-DD HH:mm:ss')}, Now: ${now.format('YYYY-MM-DD HH:mm:ss')}`);

        if (announcementTime.isSameOrBefore(now)) {
            try {
                const channel = await client.channels.fetch(announcement.channelId);
                if (channel && channel.guild.id === announcement.guildId) {
                    const embedData = JSON.parse(announcement.embedData);
                    const embed = new EmbedBuilder()
                        .setTitle(embedData.title)
                        .setDescription(embedData.description)
                        .setColor('#0099ff')
                        .setAuthor({ name: 'Pyro Freelancer Corps' })
                        .setTimestamp()
                        .setFooter({ text: 'Official PFC Communication', iconURL: 'https://i.imgur.com/5sZV5QN.png' });

                    // Resolve names
                    const channelName = await getChannelNameById(announcement.channelId, client);
                    const guildName = await getGuildNameById(announcement.guildId, client);

                    console.log(`Sending announcement to channel ${channelName} in server ${guildName}`);
                    await channel.send({ embeds: [embed] });
                    await deleteScheduledAnnouncement(announcement.id);
                } else {
                    console.error(`Channel with ID ${announcement.channelId} not found or guild ID mismatch`);
                }
            } catch (error) {
                console.error('Error sending scheduled announcement:', error);
            }
        }
    }
}

module.exports = {
    checkScheduledAnnouncements
};
