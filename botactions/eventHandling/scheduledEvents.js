const { saveEventToDatabase, updateEventInDatabase, deleteEventFromDatabase, getAllEventsFromDatabase, syncEventsInDatabase} = require('../scheduledEventsHandler')
const moment = require('moment');

async function handleCreateEvent (guildScheduledEvent, client) {

    const event = {
        event_id: guildScheduledEvent.id,
        server_id: guildScheduledEvent.guild.id,
        name: guildScheduledEvent.name,
        description: guildScheduledEvent.description,
        start_time: guildScheduledEvent.scheduledStartTimestamp,
        end_time: guildScheduledEvent.scheduledEndTimestamp,
        event_coordinator: guildScheduledEvent.creator.username,
        location: guildScheduledEvent.location,
        status: getStatus(guildScheduledEvent)
    };

    try {
        await saveEventToDatabase(event);
        console.log('Scheduled event created and saved to database.');
    } catch (error) {
        console.error('Error saving scheduled event to database:', error);
    }

}

async function handleUpdateEvent(oldGuildScheduledEvent, newGuildScheduledEvent, client) {

    const eventId = oldGuildScheduledEvent.id; // Use the scheduled event ID

    const updatedEvent = {
        name: newGuildScheduledEvent.name,
        description: newGuildScheduledEvent.description,
        start_time: newGuildScheduledEvent.scheduledStartTimestamp,
        end_time: newGuildScheduledEvent.scheduledEndTimestamp,
        event_coordinator: newGuildScheduledEvent.creator.username,
        location: newGuildScheduledEvent.location,
        status: getStatus(newGuildScheduledEvent)
    };

    try {
        await updateEventInDatabase(eventId, updatedEvent);
        console.log('Scheduled event updated in database.');
    } catch (error) {
        console.error('Error updating scheduled event in database:', error);
    }
}

async function handleDeleteEvent(guildScheduledEvent, client) {
    const eventId = guildScheduledEvent.id; // Use the scheduled event ID
    
    try {
        await deleteEventFromDatabase(eventId);
        console.log('Scheduled event deleted from database.');
    } catch (error) {
        console.error('Error deleting scheduled event from database:', error);
    }
}
function getStatus(event) {
    const now = moment();
    console.log(event.scheduled_start_time);
    console.log(event.scheduled_end_time);
    console.log(event.actual_start_time);
    console.log(event.actual_end_time);
    const startTime = event.actual_start_time ? moment(event.actual_start_time) : moment(event.scheduled_start_time);
    const endTime = event.actual_end_time ? moment(event.actual_end_time) : moment(event.scheduled_end_time);

    if (now.isBefore(startTime)) {
        return 'upcoming';
    } else if (now.isBetween(startTime, endTime, null, '[]')) {
        return 'active';
    } else if (now.isAfter(endTime)) {
        return 'ended';
    }
}


module.exports = {
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    getAllEventsFromDatabase,
    syncEventsInDatabase
}