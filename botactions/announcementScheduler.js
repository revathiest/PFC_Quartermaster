const { getScheduledAnnouncements, deleteScheduledAnnouncement } = require('./scheduleHandler');
const moment = require('moment');

const checkScheduledAnnouncements = async (client) => {
    const announcements = await getScheduledAnnouncements();
    if (!Array.isArray(announcements)) {
        console.error('Scheduled announcements are not iterable:', announcements);
        return;
    }

    const now = moment();

    for (const announcement of announcements) {
        const announcementTime = moment(announcement.time, 'MM-DD-YYYY HH:mm');
        if (announcementTime.isSameOrBefore(now)) {
            try {
                const channel = await client.channels.fetch(announcement.channelId);
                if (channel) {
                    await channel.send(announcement.message);
                    await deleteScheduledAnnouncement(announcement.id);
                }
            } catch (error) {
                console.error('Error sending scheduled announcement:', error);
            }
        }
    }
};

module.exports = (client) => {
    setInterval(() => checkScheduledAnnouncements(client), 60000); // Check every minute
};
