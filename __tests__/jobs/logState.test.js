const logState = require('../../jobs/logState');

describe('logState module', () => {
  test('exports default properties', () => {
    expect(Array.isArray(logState.pendingLogs)).toBe(true);
    expect(logState.isFlushingLogs).toEqual({ value: false });
  });
});
