const ScheduledAnnouncement = require('../models/scheduledAnnouncementModel');

const saveAnnouncementToDatabase = async (channelId, embedData, time) => {
    try {
        await ScheduledAnnouncement.create({ channelId, embedData: JSON.stringify(embedData), time });
        console.log(`Announcement saved to database: channelId=${channelId}, embedData=${JSON.stringify(embedData)}, time=${time}`);
    } catch (error) {
        console.error('Error saving announcement to database:', error);
    }
};

const getScheduledAnnouncements = async () => {
    try {
        const announcements = await ScheduledAnnouncement.findAll();
        console.log(`Retrieved ${announcements.length} scheduled announcements from database`);
        return announcements;
    } catch (error) {
        console.error('Error retrieving scheduled announcements from database:', error);
        return [];
    }
};

const deleteScheduledAnnouncement = async (id) => {
    try {
        await ScheduledAnnouncement.destroy({ where: { id } });
        console.log(`Announcement with id=${id} deleted from database.`);
    } catch (error) {
        console.error('Error deleting scheduled announcement from database:', error);
    }
};

module.exports = {
    saveAnnouncementToDatabase,
    getScheduledAnnouncements,
    deleteScheduledAnnouncement,
};
