const { saveEventToDatabase, updateEventInDatabase, deleteEventFromDatabase, getAllEventsFromDatabase, syncEventsInDatabase} = require('../scheduledEventsHandler');
const { Hunt } = require('../../config/database');
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
        console.log('📌 Scheduled event created and saved to database.');
        const loc = guildScheduledEvent.location?.toLowerCase().replace(/\s+/g, ' ').trim();
        if (loc && /scavenger[- ]?hunt/.test(loc)) {
            await Hunt.create({
                name: guildScheduledEvent.name,
                description: guildScheduledEvent.description,
                discord_event_id: guildScheduledEvent.id,
                starts_at: new Date(guildScheduledEvent.scheduledStartTimestamp),
                ends_at: new Date(guildScheduledEvent.scheduledEndTimestamp)
            });
            console.log('📌 Scavenger hunt created in database.');
        }
    } catch (error) {
        console.error('❌ Error saving scheduled event to database:', error);
    }

}

async function handleUpdateEvent(oldGuildScheduledEvent, newGuildScheduledEvent, client) {

    const eventStatus = getStatus(newGuildScheduledEvent.status);

    switch(eventStatus){
        case 'ended':
        case 'canceled':

            console.log('🗑️ Attempting to delete event from database.');
            handleDeleteEvent(newGuildScheduledEvent);
            return;
        default:
    }

    console.log('🔄 Updating event in database.')

    const eventId = oldGuildScheduledEvent.id; // Use the scheduled event ID

    const updatedEvent = {
        name: newGuildScheduledEvent.name,
        description: newGuildScheduledEvent.description,
        start_time: newGuildScheduledEvent.scheduledStartTimestamp,
        end_time: newGuildScheduledEvent.scheduledEndTimestamp,
        event_coordinator: newGuildScheduledEvent.creator.username,
        location: newGuildScheduledEvent.location,
        status: getStatus(newGuildScheduledEvent.status)
    };

    try {
        await updateEventInDatabase(eventId, updatedEvent);
        console.log('✅ Scheduled event updated in database.');
        const hunt = await Hunt.findOne({ where: { discord_event_id: eventId } });
        if (hunt) {
            await hunt.update({
                name: newGuildScheduledEvent.name,
                description: newGuildScheduledEvent.description,
                starts_at: new Date(newGuildScheduledEvent.scheduledStartTimestamp),
                ends_at: new Date(newGuildScheduledEvent.scheduledEndTimestamp)
            });
            console.log('✅ Scavenger hunt updated in database.');
        }
    } catch (error) {
        console.error('❌ Error updating scheduled event in database:', error);
    }
}

async function handleDeleteEvent(guildScheduledEvent) {
    const eventId = guildScheduledEvent.id; // Use the scheduled event ID
    
    try {
        await deleteEventFromDatabase(eventId);
        console.log('🗑️ Scheduled event deleted from database.');
    } catch (error) {
        console.error('❌ Error deleting scheduled event from database:', error);
    }
}
function getStatus(numericStatus) {
    switch (numericStatus) {
        case 1:
            return 'upcoming';
        case 2:
            return 'active';
        case 3:
            return 'ended';
        case 4:
            return 'canceled';
        default:
            return 'upcoming';
    }
}


module.exports = {
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    getAllEventsFromDatabase,
    syncEventsInDatabase
}