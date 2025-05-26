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
    expect(send).toHaveBeenCalledWith({
      content: expect.stringContaining('one\ntwo')
    });
    expect(logState.pendingLogs.length).toBe(0);
    expect(logState.isFlushingLogs.value).toBe(false);
  });

  test('truncates very long batches', async () => {
    const longLine = 'x'.repeat(2000);
    logState.pendingLogs.push(longLine);
    const send = jest.fn().mockResolvedValue();
    const client = {
      chanBotLog: '1',
      channels: { cache: new Map([['1', { send }]]) }
    };

    await flushLogs(client);
    const sent = send.mock.calls[0][0].content;
    expect(sent.length).toBe(1907); // prefix of four tabs + truncated batch
    expect(sent.endsWith('...')).toBe(true);
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

  test('does nothing when no logs pending', async () => {
    const send = jest.fn();
    const client = {
      chanBotLog: '1',
      channels: { cache: new Map([['1', { send }]]) }
    };

    await flushLogs(client);
    expect(send).not.toHaveBeenCalled();
  });

  test('does nothing when channel not found', async () => {
    logState.pendingLogs.push('hi');
    const client = {
      chanBotLog: '99',
      channels: { cache: new Map() }
    };

    await flushLogs(client);
    expect(logState.pendingLogs.length).toBe(1);
  });
});
