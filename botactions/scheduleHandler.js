const ScheduledAnnouncement = require('../models/scheduledAnnouncementModel');

const saveAnnouncementToDatabase = async (channelId, message, time) => {
    try {
        await ScheduledAnnouncement.create({ channelId, message, time });
        console.log('Announcement saved to database.');
    } catch (error) {
        console.error('Error saving announcement to database:', error);
    }
};

const getScheduledAnnouncements = async () => {
    try {
        console.log('Attempting to retrieve announcements from database');
        const announcements = await ScheduledAnnouncement.findAll();
        console.log(`Retrieved ${announcements.length} scheduled announcements from database`);
        return announcements
    } catch (error) {
        console.error('Error retrieving scheduled announcements from database:', error);
        return [];  // Return an empty array in case of error
    }
};

const deleteScheduledAnnouncement = async (id) => {
    try {
        await ScheduledAnnouncement.destroy({ where: { id } });
        console.log('Announcement deleted from database.');
    } catch (error) {
        console.error('Error deleting scheduled announcement from database:', error);
    }
};

module.exports = {
    saveAnnouncementToDatabase,
    getScheduledAnnouncements,
    deleteScheduledAnnouncement,
};
