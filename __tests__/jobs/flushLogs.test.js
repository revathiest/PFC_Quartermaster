const { flushLogs } = require('../../jobs/flushLogs');
const logState = require('../../jobs/logState');

describe('flushLogs', () => {
  beforeEach(() => {
    logState.pendingLogs.length = 0;
    logState.isFlushingLogs.value = false;
    global.origConsoleError = jest.fn();
  });

  test('sends logs when channel exists', async () => {
    logState.pendingLogs.push('one', 'two');
    const send = jest.fn().mockResolvedValue();
    const client = {
      chanBotLog: '1',
      channels: { cache: new Map([['1', { send }]]) }
    };

    await flushLogs(client);
    expect(send).toHaveBeenCalled();
    expect(logState.pendingLogs.length).toBe(0);
    expect(logState.isFlushingLogs.value).toBe(false);
  });

  test('handles send errors', async () => {
    logState.pendingLogs.push('oops');
    const send = jest.fn().mockRejectedValue(new Error('fail'));
    const client = {
      chanBotLog: '1',
      channels: { cache: new Map([['1', { send }]]) }
    };

    await flushLogs(client);
    expect(global.origConsoleError).toHaveBeenCalled();
    expect(logState.isFlushingLogs.value).toBe(false);
  });
});
