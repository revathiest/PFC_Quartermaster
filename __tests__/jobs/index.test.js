jest.mock('../../jobs/scheduler', () => ({ scheduleDailyApiSync: jest.fn() }));
jest.mock('../../jobs/flushLogs', () => ({ flushLogs: jest.fn() }));
jest.mock('../../botactions/scheduling', () => ({ checkEvents: jest.fn() }));
jest.mock('../../botactions/maintenance/logCleanup', () => ({ deleteOldLogs: jest.fn() }));
const { scheduleDailyApiSync } = require('../../jobs/scheduler');
const { flushLogs } = require('../../jobs/flushLogs');
const { checkEvents } = require('../../botactions/scheduling');
const { deleteOldLogs } = require('../../botactions/maintenance/logCleanup');
const { startAllScheduledJobs } = require('../../jobs');

describe('startAllScheduledJobs', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'setInterval');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('schedules jobs and intervals', () => {
    const intervals = [];
    setInterval.mockImplementation((fn, delay) => {
      intervals.push({ fn, delay });
    });

    const client = { id: 'c' };
    startAllScheduledJobs(client);

    expect(scheduleDailyApiSync).toHaveBeenCalledWith(4, 0);
    expect(intervals.map(i => i.delay)).toEqual([2000, 60000, 86400000]);

    intervals.forEach(i => i.fn());
    expect(flushLogs).toHaveBeenCalledWith(client);
    expect(checkEvents).toHaveBeenCalledWith(client);
    expect(deleteOldLogs).toHaveBeenCalledWith(client);
  });
});
