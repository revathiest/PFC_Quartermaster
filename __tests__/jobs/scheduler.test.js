// __tests__/jobs/scheduler.test.js

jest.mock('../../utils/apiSync/syncApiData', () => ({
  runFullApiSync: jest.fn().mockResolvedValue()
}));

const { scheduleDailyApiSync } = require('../../jobs/scheduler');
const { runFullApiSync } = require('../../utils/apiSync/syncApiData');

describe('scheduleDailyApiSync', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    logSpy.mockRestore();
  });

  test('schedules API sync at next midnight UTC', async () => {
    const baseTime = new Date('2023-01-01T23:59:30.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(baseTime);
    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'setInterval');

    scheduleDailyApiSync(0, 0);

    const now = new Date(baseTime);
    const next = new Date(baseTime);
    next.setUTCHours(0, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const expectedDelay = next - now;

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), expectedDelay);

    await jest.advanceTimersByTimeAsync(expectedDelay);
    await Promise.resolve();

    expect(runFullApiSync).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);
  });

  test('schedules API sync later the same day when future time', async () => {
    const baseTime = new Date('2023-01-01T03:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(baseTime);
    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'setInterval');

    scheduleDailyApiSync(4, 0);

    const now = new Date(baseTime);
    const next = new Date(baseTime);
    next.setUTCHours(4, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const expectedDelay = next - now;

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), expectedDelay);

    await jest.advanceTimersByTimeAsync(expectedDelay);
    await Promise.resolve();

    expect(runFullApiSync).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);
  });

  test('logs an error when runFullApiSync fails', async () => {
    const baseTime = new Date('2023-01-01T03:59:30.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(baseTime);
    runFullApiSync.mockRejectedValueOnce(new Error('fail'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    scheduleDailyApiSync(); // uses defaults of 4:00

    const now = new Date(baseTime);
    const next = new Date(baseTime);
    next.setUTCHours(4, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const expectedDelay = next - now;

    await jest.advanceTimersByTimeAsync(expectedDelay);
    await Promise.resolve();

    expect(runFullApiSync).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('❌ API sync failed:', expect.any(Error));
  });
});

