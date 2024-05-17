const { getScheduledAnnouncements, deleteScheduledAnnouncement } = require('./scheduleHandler');
const { Client } = require('discord.js');
const moment = require('moment');

const checkScheduledAnnouncements = async (client) => {
    const announcements = await getScheduledAnnouncements();
    const now = moment();

    for (const announcement of announcements) {
        const announcementTime = moment(announcement.time, 'YYYY-MM-DD HH:mm:ss');
        if (announcementTime.isSameOrBefore(now)) {
            const channel = await client.channels.fetch(announcement.channelId);
            if (channel) {
                await channel.send(announcement.message);
                await deleteScheduledAnnouncement(announcement.id);
            }
        }
    }
};

module.exports = (client) => {
    setInterval(() => checkScheduledAnnouncements(client), 60000); // Check every minute
};
