const ScheduledAnnouncement = require('../models/scheduledAnnouncementModel');

const saveAnnouncementToDatabase = async (channelId, guildId, embedData, time) => {
  try {
    await ScheduledAnnouncement.create({
      channelId,
      guildId: String(guildId),  // Ensure guildId is a string
      embedData: JSON.stringify(embedData),
      time: String(time)  // Ensure time is a string and not null
    });
    console.log(`Announcement saved to database: channelId=${channelId}, guildId=${guildId}, embedData=${JSON.stringify(embedData)}, time=${time}`);
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
