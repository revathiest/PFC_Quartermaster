const { getScheduledAnnouncements, deleteScheduledAnnouncement } = require('./scheduleHandler');
const moment = require('moment');

const checkScheduledAnnouncements = async (client) => {
    const announcements = await getScheduledAnnouncements();
    if (!Array.isArray(announcements)) {
        console.error('Scheduled announcements are not iterable:', announcements);
        return;
    }

    const now = moment();
    console.log(`Checking scheduled announcements at ${now.format('YYYY-MM-DD HH:mm:ss')}`);

    for (const announcement of announcements) {
        const announcementTime = moment(announcement.time, 'YYYY-MM-DD HH:mm:ss');
        console.log(`Announcement time: ${announcementTime.format('YYYY-MM-DD HH:mm:ss')}, Now: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
        
        if (announcementTime.isSameOrBefore(now)) {
            try {
                const channel = await client.channels.fetch(announcement.channelId);
                if (channel) {
                    console.log(`Sending announcement to channel ${announcement.channelId}: ${announcement.message}`);
                    await channel.send(announcement.message);
                    await deleteScheduledAnnouncement(announcement.id);
                } else {
                    console.error(`Channel with ID ${announcement.channelId} not found`);
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
