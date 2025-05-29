/**
 * Full Jest test suite for scheduledEventsHandler.js
 * Includes tests for all functions: database operations and sync logic.
 */

// Mock Sequelize methods FIRST
jest.mock('../../config/database', () => ({
    Event: {
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
    },
  }));
  
  const {
    saveEventToDatabase,
    updateEventInDatabase,
    deleteEventFromDatabase,
    getAllEventsFromDatabase,
    syncEventsInDatabase,
  } = require('../../botactions/scheduledEventsHandler');
  
  const { Event } = require('../../config/database');
  const { Collection } = require('@discordjs/collection');
  
  describe('scheduledEventsHandler full module tests', () => {
    let mockClient, mockGuild;
  
    beforeEach(() => {
      jest.clearAllMocks();
  
      mockGuild = {
        id: 'server1',
        name: 'Test Guild',
        scheduledEvents: {
          fetch: jest.fn().mockResolvedValue({ map: () => [] }),
        },
      };
  
      mockClient = {
        guilds: {
          cache: new Collection([['server1', mockGuild]]),
        },
      };
    });
  
    describe('saveEventToDatabase', () => {
      it('creates an event successfully', async () => {
        const mockEvent = { name: 'Test Event' };
        Event.create.mockResolvedValue(mockEvent);
        const result = await saveEventToDatabase(mockEvent);
        expect(Event.create).toHaveBeenCalledWith(mockEvent);
        expect(result).toBe(mockEvent);
      });

      it('logs error on failure', async () => {
        Event.create.mockRejectedValue(new Error('fail'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await saveEventToDatabase({});
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  
    describe('updateEventInDatabase', () => {
      it('updates event when found', async () => {
        const mockEvent = { update: jest.fn().mockResolvedValue(true), name: 'Old Name' };
        Event.findByPk.mockResolvedValue(mockEvent);
        await updateEventInDatabase(1, { name: 'Updated Event' });
        expect(Event.findByPk).toHaveBeenCalledWith(1);
        expect(mockEvent.update).toHaveBeenCalledWith({ name: 'Updated Event' });
      });
  
      it('handles event not found', async () => {
        Event.findByPk.mockResolvedValue(null);
        const result = await updateEventInDatabase(999, { name: 'Nonexistent' });
        expect(result).toBeNull();
      });

      it('logs error on db failure', async () => {
        Event.findByPk.mockRejectedValue(new Error('fail'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await updateEventInDatabase(1, { name: 'fail' });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  
    describe('deleteEventFromDatabase', () => {
      it('deletes event when found', async () => {
        const mockEvent = { destroy: jest.fn().mockResolvedValue(true), name: 'To Delete' };
        Event.findByPk.mockResolvedValue(mockEvent);
        const result = await deleteEventFromDatabase(2);
        expect(Event.findByPk).toHaveBeenCalledWith(2);
        expect(mockEvent.destroy).toHaveBeenCalled();
        expect(result).toBe(mockEvent);
      });
  
      it('handles event not found for deletion', async () => {
        Event.findByPk.mockResolvedValue(null);
        const result = await deleteEventFromDatabase(999);
        expect(result).toBeNull();
      });

      it('logs error when fetch fails', async () => {
        Event.findByPk.mockRejectedValue(new Error('fail'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await deleteEventFromDatabase(1);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  
    describe('getAllEventsFromDatabase', () => {
      it('retrieves events', async () => {
        const mockEvents = [{ event_id: 1 }, { event_id: 2 }];
        Event.findAll.mockResolvedValue(mockEvents);
        const result = await getAllEventsFromDatabase();
        expect(Event.findAll).toHaveBeenCalled();
        expect(result).toBe(mockEvents);
      });

      it('logs error when query fails', async () => {
        Event.findAll.mockRejectedValue(new Error('fail'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await getAllEventsFromDatabase();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  
    describe('getAllScheduledEventsFromClient', () => {
      const { getAllScheduledEventsFromClient } = require('../../botactions/scheduledEventsHandler');
  
      it('fetches and formats events from client', async () => {
        const mockEvent = {
          id: '1',
          name: 'Event One',
          description: 'Test description',
          scheduledStartTimestamp: Date.now(),
          scheduledEndTimestamp: Date.now() + 3600000,
          creator: { username: 'Commander Shepard' },
          location: 'Hangar 18',
        };
  
        mockGuild.scheduledEvents.fetch.mockResolvedValue(
          new Collection([[mockEvent.id, mockEvent]])
        );
        const result = await getAllScheduledEventsFromClient(mockClient);
        expect(result.length).toBe(1);
        expect(result[0]).toMatchObject({
          id: '1',
          name: 'Event One',
          coordinator: 'Commander Shepard',
        });
      });

      it('uses defaults when location or creator missing', async () => {
        const mockEvent = {
          id: '2',
          name: 'Event Two',
          description: 'desc',
          scheduledStartTimestamp: Date.now(),
          scheduledEndTimestamp: Date.now() + 1000,
        };

        mockGuild.scheduledEvents.fetch.mockResolvedValue(
          new Collection([[mockEvent.id, mockEvent]])
        );

        const result = await getAllScheduledEventsFromClient(mockClient);
        expect(result[0].location).toBe('No location');
        expect(result[0].coordinator).toBe('Unknown');
      });

      it('throws when fetch fails', async () => {
        mockGuild.scheduledEvents.fetch.mockRejectedValue(new Error('fail'));
        await expect(getAllScheduledEventsFromClient(mockClient)).rejects.toThrow('There was an error fetching the events.');
      });
    });

    describe('syncEventsInDatabase', () => {
        let mockGetAllScheduledEventsFromClient;
      
        beforeEach(() => {
          mockGetAllScheduledEventsFromClient = jest
            .spyOn(require('../../botactions/scheduledEventsHandler'), 'getAllScheduledEventsFromClient');
        });
      
        afterEach(() => {
          jest.restoreAllMocks();
        });
      
        it('syncs events: updates, creates, deletes correctly', async () => {
          const dbEvents = [{ event_id: '1', name: 'Old Name', server_id: 'server1' }];
          const startTime = new Date();
          const endTime = new Date(startTime.getTime() + 3600000);
      
          // This is what your sync logic expects from getAllScheduledEventsFromClient
          const mockEvent = {
            id: '1',                                // ✅ Must match event_id as string
            name: 'Event One',
            description: 'Updated description',
            scheduledStartTimestamp: startTime.getTime(), // ✅ This is what your real function reads
            scheduledEndTimestamp: endTime.getTime(),
            creator: { username: 'Commander Shepard' },
            location: 'Hangar 18',
          };
      
          // Properly mock the fetch to return a Collection (not a plain object)
          mockGuild.scheduledEvents.fetch.mockResolvedValue(
            new Collection([[mockEvent.id, mockEvent]])
          );
      
          Event.findAll.mockResolvedValue(dbEvents);
      
          await syncEventsInDatabase(mockClient); // ✅ Correct call
      
          expect(Event.update).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'Event One',
              description: 'Updated description',
              start_time: expect.any(Date),
              end_time: expect.any(Date),
              event_coordinator: 'Commander Shepard',
              location: 'Hangar 18',
              updated_at: expect.any(Date),
            }),
            { where: { event_id: '1' } }
          );
          expect(Event.create).not.toHaveBeenCalled();
        });
      });

      describe('edge cases and error paths', () => {
        it('removes db events not present on the server', async () => {
          const dbEvents = [{ event_id: '2', name: 'Old Name', server_id: 'server1' }];
          mockGuild.scheduledEvents.fetch.mockResolvedValue(new Collection());
          Event.findAll.mockResolvedValue(dbEvents);

          await syncEventsInDatabase(mockClient);

          expect(Event.destroy).toHaveBeenCalledWith({
            where: { event_id: '2', server_id: 'server1' },
          });
        });

        it('logs error when sync fails to query db', async () => {
          Event.findAll.mockRejectedValue(new Error('fail'));
          const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
          await syncEventsInDatabase(mockClient);
          expect(consoleSpy).toHaveBeenCalled();
          consoleSpy.mockRestore();
        });
      });


  });
  