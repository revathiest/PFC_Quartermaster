const path = require('path');

// Mock heavy dependencies
jest.mock('../config/database', () => require('../__mocks__/config/database'));
jest.mock('../botactions/initClient', () => ({ initClient: jest.fn(() => ({ on: jest.fn(), once: jest.fn() })) }));
jest.mock('../botactions/eventHandling', () => ({
  interactionHandler: { handleInteraction: jest.fn() },
  handleMessageCreate: jest.fn(),
  handleReactionAdd: jest.fn(),
  handleReactionRemove: jest.fn(),
  handleVoiceStateUpdate: jest.fn()
}));
jest.mock('../botactions/channelManagement', () => ({ registerChannels: jest.fn() }));
jest.mock('../utils/commandRegistration', () => ({ registerCommands: jest.fn() }));
jest.mock('../botactions/configLoader', () => ({ loadConfiguration: jest.fn(() => ({ token: 'TEST_TOKEN' })) }));
jest.mock('../botactions/scheduling', () => ({ startScheduledAnnouncementEngine: jest.fn() }));
jest.mock('../botactions/userManagement', () => ({
  getInactiveUsersWithSingleRole: jest.fn(),
  handleRoleAssignment: jest.fn(),
  enforceNicknameFormat: jest.fn(),
  sweepVerifiedNicknames: jest.fn()
}));
jest.mock('../botactions/eventHandling/scheduledEvents', () => ({
  handleCreateEvent: jest.fn(),
  handleUpdateEvent: jest.fn(),
  handleDeleteEvent: jest.fn(),
  syncEventsInDatabase: jest.fn()
}));
jest.mock('../botactions/ambient/ambientEngine', () => ({ startAmbientEngine: jest.fn() }));
jest.mock('../botactions/maintenance/logCleanup', () => ({ deleteOldLogs: jest.fn() }));
jest.mock('../botactions/eventHandling/memberJoinEvent', () => ({ handleMemberJoin: jest.fn() }));
jest.mock('../botactions/orgTagSync/syncScheduler', () => ({ startOrgTagSyncScheduler: jest.fn() }));
jest.mock('../jobs', () => ({ startAllScheduledJobs: jest.fn() }));

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

let bot;
let pendingLogs;

describe('bot.js core utilities', () => {
  beforeEach(() => {
    jest.resetModules();
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    bot = require('../bot');
    pendingLogs = require('../jobs/logState').pendingLogs;
    pendingLogs.length = 0;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  test('console.log forwards to pending logs', () => {
    const initial = pendingLogs.length;
    console.log('Hello');
    expect(pendingLogs.length).toBe(initial + 1);
    expect(pendingLogs[pendingLogs.length - 1]).toContain('[LOG]');
    expect(pendingLogs[pendingLogs.length - 1]).toContain('Hello');
  });

  test('sendToDiscordLogChannel pushes messages', () => {
    bot.sendToDiscordLogChannel('TestMessage');
    expect(pendingLogs[pendingLogs.length - 1]).toBe('TestMessage');
  });

  describe('safeLogin behavior', () => {
    test('retries on failure then succeeds', async () => {
      jest.useFakeTimers();
      const client = { login: jest.fn() };
      client.login
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce();
      bot.safeLogin(client, 'token', 1);
      expect(client.login).toHaveBeenCalledTimes(1);
      await Promise.resolve();
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      expect(client.login).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });

    test('exits process after max retries', async () => {
      jest.useFakeTimers();
      const client = { login: jest.fn().mockRejectedValue(new Error('fail')) };
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      bot.safeLogin(client, 'token', 0);
      await Promise.resolve();
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
      jest.useRealTimers();
    });
  });
});
