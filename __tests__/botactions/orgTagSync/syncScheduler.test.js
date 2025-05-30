jest.useFakeTimers();
jest.mock('../../../botactions/orgTagSync/syncOrgTags', () => ({ syncOrgTags: jest.fn() }));

const { startOrgTagSyncScheduler } = require('../../../botactions/orgTagSync/syncScheduler');
const { syncOrgTags } = require('../../../botactions/orgTagSync/syncOrgTags');

describe('startOrgTagSyncScheduler', () => {
  test('runs sync immediately and on interval', () => {
    startOrgTagSyncScheduler('client');
    expect(syncOrgTags).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(12 * 60 * 60 * 1000);
    expect(syncOrgTags).toHaveBeenCalledTimes(2);
  });
});
