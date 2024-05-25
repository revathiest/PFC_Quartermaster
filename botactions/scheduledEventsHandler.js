const { Event } = require('../config/database');

const saveEventToDatabase = async (event) => {
    try {
        const newEvent = await Event.create(event);
        console.log('Event saved to database:', newEvent);
        return newEvent;
    } catch (error) {
        console.error('Error saving event to database:', error);
    }
};

const updateEventInDatabase = async (event_id, updatedEvent) => {
    try {
        const event = await Event.findByPk(event_id);
        if (event) {
            await event.update(updatedEvent);
            console.log('Event updated in database:', event);
            return event;
        } else {
            console.log('Event not found');
            return null;
        }
    } catch (error) {
        console.error('Error updating event in database:', error);
    }
};

const deleteEventFromDatabase = async (event_id) => {
    try {
        const event = await Event.findByPk(event_id);
        if (event) {
            await event.destroy();
            console.log('Event deleted from database:', event);
            return event;
        } else {
            console.log('Event not found');
            return null;
        }
    } catch (error) {
        console.error('Error deleting event from database:', error);
    }
};

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
    saveEventToDatabase,
    updateEventInDatabase,
    deleteEventFromDatabase,
    getAllEventsFromDatabase
};