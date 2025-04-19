const { Event } = require('../config/database');

const saveEventToDatabase = async (event) => {
    try {
        const newEvent = await Event.create(event);
        console.log(`📅 Event "${event.name}" saved to database.`);
        return newEvent;
    } catch (error) {
        console.error('❌ Error saving event to database:', error);
    }
};

const updateEventInDatabase = async (event_id, updatedEvent) => {
    try {
        const event = await Event.findByPk(event_id);
        if (event) {
            await event.update(updatedEvent);
            console.log(`📝 Event "${updatedEvent.name}" updated in database.`);
            return event;
        } else {
            console.log('⚠️ Event not found for update.');
            return null;
        }
    } catch (error) {
        console.error('❌ Error updating event in database:', error);
    }
};

const deleteEventFromDatabase = async (event_id) => {
    try {
        const event = await Event.findByPk(event_id);
        if (event) {
            await event.destroy();
            console.log(`🗑️ Event "${event.name}" deleted from database.`);
            return event;
        } else {
            console.log('⚠️ Event not found for deletion.');
            return null;
        }
    } catch (error) {
        console.error('❌ Error deleting event from database:', error);
    }
};

const getAllEventsFromDatabase = async () => {
    try {
        const events = await Event.findAll();
        console.log(`📦 Retrieved ${events.length} event(s) from database.`);
        return events;
    } catch (error) {
        console.error('❌ Error retrieving all events from database:', error);
    }
};

async function getAllScheduledEventsFromClient(client) {
    try {
        let allEvents = [];

        for (const [guildId, guild] of client.guilds.cache) {
            const events = await guild.scheduledEvents.fetch();
            const eventList = events.map(event => ({
                guildId: guildId,
                guildName: guild.name,
                id: event.id,
                name: event.name,
                description: event.description,
                startTime: new Date(event.scheduledStartTimestamp).toLocaleString(),
                endTime: new Date(event.scheduledEndTimestamp).toLocaleString(),
                location: event.location || 'No location',
                coordinator: event.creator ? event.creator.username : 'Unknown'
            }));
            allEvents = allEvents.concat(eventList);
        }

        console.log(`🔍 Fetched ${allEvents.length} scheduled event(s) from Discord client.`);
        return allEvents;
    } catch (error) {
        console.error('❌ Error fetching events from client:', error);
        throw new Error('There was an error fetching the events.');
    }
};

async function syncEventsInDatabase(client) {
    try {
        const serverId = client.guilds.cache.first().id;

        const dbEvents = await Event.findAll();
        const servEvents = await getAllScheduledEventsFromClient(client);

        const dbEventsMap = new Map(dbEvents.map(event => [event.event_id, event]));

        for (const servEvent of servEvents) {
            const dbEvent = dbEventsMap.get(servEvent.id);

            console.log(`🔄 Syncing event: ${servEvent.name} (${servEvent.id})`);
            try {
                if (dbEvent) {
                    await Event.update({
                        name: servEvent.name,
                        description: servEvent.description,
                        start_time: new Date(servEvent.startTime),
                        end_time: new Date(servEvent.endTime),
                        event_coordinator: servEvent.coordinator,
                        location: servEvent.location,
                        updated_at: new Date()
                    }, {
                        where: { event_id: servEvent.id }
                    });
                    console.log(`✅ Updated event: ${servEvent.name}`);
                } else {
                    await Event.create({
                        event_id: servEvent.id,
                        server_id: servEvent.guildId,
                        name: servEvent.name,
                        description: servEvent.description,
                        start_time: new Date(servEvent.startTime),
                        end_time: new Date(servEvent.endTime),
                        event_coordinator: servEvent.coordinator,
                        location: servEvent.location
                    });
                    console.log(`➕ Created new event: ${servEvent.name}`);
                }
            } catch {
                console.log('⚠️ Unable to sync event... continuing...');
            }
        }

        const servEventsMap = new Map(servEvents.map(event => [event.id, event]));
        for (const dbEvent of dbEvents) {
            if (!servEventsMap.has(dbEvent.event_id)) {
                await Event.destroy({
                    where: { event_id: dbEvent.event_id, server_id: serverId }
                });
                console.log(`🗑️ Removed stale event: ${dbEvent.name}`);
            }
        }

        console.log('✅ Database synchronized with client events.');
    } catch (error) {
        console.error('❌ Error synchronizing events:', error);
    }
};

module.exports = {
    saveEventToDatabase,
    updateEventInDatabase,
    deleteEventFromDatabase,
    getAllEventsFromDatabase,
    syncEventsInDatabase
};
