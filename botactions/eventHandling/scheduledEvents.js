const { now } = require('sequelize/types/utils');
const { saveEventToDatabase, updateEventInDatabase, deleteEventFromDatabase } = require('../scheduledEventsHandler')


async function handleCreateEvent (guildScheduledEvent, client) {

    const event = {
        event_id: guildScheduledEvent.id,
        server_id: guildScheduledEvent.guild.id,
        name: guildScheduledEvent.name,
        description: guildScheduledEvent.description,
        start_time: guildScheduledEvent.scheduledStartTimestamp,
        end_time: guildScheduledEvent.scheduledEndTimestamp,
        event_coordinator: guildScheduledEvent.creator.username,
        location: guildScheduledEvent.location
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
        location: newGuildScheduledEvent.location
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

const getAllEventsFromDatabase = async () => {
    try {
        const events = await Event.findAll();
        console.log('All events retrieved from database:', events);
        return events;
    } catch (error) {
        console.error('Error retrieving all events from database:', error);
    }
};

module.exports = {
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    getAllEventsFromDatabase
}