const {
  canRunManualSync,
  markManualSyncRun,
  resetManualSyncTracker
} = require('../../../botactions/orgTagSync/syncCooldownTracker');

describe('Manual Sync Cooldown Logic', () => {
  beforeEach(() => {
    resetManualSyncTracker();
  });

  test('should allow manual sync on first run (null path)', () => {
    // This covers the branch where lastManualSyncTime === null
    expect(canRunManualSync(0)).toBe(true);
  });

  test('should block manual sync immediately after marking it (non-null path)', () => {
    markManualSyncRun(0); // Now lastManualSyncTime !== null
    // This hits the OTHER branch path where it falls through to the math
    expect(canRunManualSync(0)).toBe(false);
  });

  test('should allow manual sync again after cooldown period', () => {
    markManualSyncRun(0);
    expect(canRunManualSync(60 * 60 * 1000 + 1)).toBe(true); // Past cooldown
  });

  test('should still block manual sync if cooldown not yet passed', () => {
    markManualSyncRun(0);
    expect(canRunManualSync(30 * 60 * 1000)).toBe(false); // Not enough time
  });
});
