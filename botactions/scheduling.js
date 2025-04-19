//const { checkScheduledAnnouncements } = require('./scheduling/announcementScheduler');
const { checkEvents } = require('./scheduling/eventReminder');
//const { saveAnnouncementToDatabase, getScheduledAnnouncements, deleteScheduledAnnouncement,} = require('./scheduling/scheduleHandler');
const { startScheduledAnnouncementEngine } = require('./scheduling/scheduledAnnouncementEngine');

module.exports = {
    //checkScheduledAnnouncements,
    checkEvents,
    //saveAnnouncementToDatabase,
    //getScheduledAnnouncements,
    //deleteScheduledAnnouncement,
    startScheduledAnnouncementEngine
}