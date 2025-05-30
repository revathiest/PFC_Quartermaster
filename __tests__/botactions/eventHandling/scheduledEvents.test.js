jest.mock('../../../botactions/scheduledEventsHandler', () => ({
  saveEventToDatabase: jest.fn(),
  updateEventInDatabase: jest.fn(),
  deleteEventFromDatabase: jest.fn(),
  getAllEventsFromDatabase: jest.fn(),
  syncEventsInDatabase: jest.fn()
}));

const handler = require('../../../botactions/scheduledEventsHandler');
const events = require('../../../botactions/eventHandling/scheduledEvents');

describe('scheduledEvents handlers', () => {
  let event;
  beforeEach(() => {
    jest.clearAllMocks();
    event = {
      id: 'e1',
      guild: { id: 'g1' },
      name: 'Test',
      description: 'desc',
      scheduledStartTimestamp: 1,
      scheduledEndTimestamp: 2,
      creator: { username: 'creator' },
      location: 'loc',
      status: 1
    };
  });

  test('handleCreateEvent saves event', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await events.handleCreateEvent(event);
    expect(handler.saveEventToDatabase).toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  test('handleUpdateEvent deletes when ended', async () => {
    await events.handleUpdateEvent(event, { ...event, status: 3 });
    expect(handler.deleteEventFromDatabase).toHaveBeenCalled();
  });

  test('handleUpdateEvent updates when active', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await events.handleUpdateEvent(event, { ...event, status: 2 }, {});
    expect(handler.updateEventInDatabase).toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  test('handleDeleteEvent removes event', async () => {
    await events.handleDeleteEvent(event);
    expect(handler.deleteEventFromDatabase).toHaveBeenCalledWith('e1');
  });

  test('handleCreateEvent logs error when save fails', async () => {
    handler.saveEventToDatabase.mockRejectedValue(new Error('fail'));
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    await events.handleCreateEvent(event);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  test('handleUpdateEvent logs error when update fails', async () => {
    handler.updateEventInDatabase.mockRejectedValue(new Error('fail'));
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    await events.handleUpdateEvent(event, { ...event, status: 2 }, {});
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  test('handleDeleteEvent logs error when delete fails', async () => {
    handler.deleteEventFromDatabase.mockRejectedValue(new Error('fail'));
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    await events.handleDeleteEvent(event);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  test('handleUpdateEvent updates when upcoming', async () => {
    await events.handleUpdateEvent(event, { ...event, status: 1 }, {});
    expect(handler.updateEventInDatabase).toHaveBeenCalled();
  });

  test('handleUpdateEvent deletes when canceled', async () => {
    await events.handleUpdateEvent(event, { ...event, status: 4 });
    expect(handler.deleteEventFromDatabase).toHaveBeenCalled();
  });
});
