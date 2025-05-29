const { startAmbientEngine, trackChannelActivity } = require('../../../botactions/ambient/ambientEngine');
const { AmbientChannel, AmbientSetting, AmbientMessage } = require('../../../config/database');

jest.useFakeTimers();

jest.mock('../../../config/database', () => ({
  AmbientChannel: { findAll: jest.fn() },
  AmbientSetting: { findOne: jest.fn() },
  AmbientMessage: { findAll: jest.fn() }
}));

describe('ambientEngine', () => {
  let client;
  let channel;
  let logSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    channel = { isTextBased: () => true, name: 'general', send: jest.fn() };
    client = { channels: { cache: new Map([['1', channel]]) } };
    AmbientChannel.findAll.mockResolvedValue([{ channelId: '1' }]);
    AmbientSetting.findOne.mockResolvedValue({ minMessagesSinceLast: 1, freshWindowMs: 120000 });
    AmbientMessage.findAll.mockResolvedValue([{ content: 'hi' }]);
  });

  afterEach(() => {
    jest.useRealTimers();
    logSpy.mockRestore();
  });

  test('sends ambient message when channel active', async () => {
    await startAmbientEngine(client);
    trackChannelActivity({ author: { bot: false }, channel: { id: '1' } });

    jest.advanceTimersByTime(60000);
    await Promise.resolve();

    expect(channel.send).toHaveBeenCalledWith('hi');
  });

  test('ignores activity from disallowed channel', async () => {
    AmbientChannel.findAll.mockResolvedValue([]); // no allowed channels
    await startAmbientEngine(client);
    trackChannelActivity({ author: { bot: false }, channel: { id: '1' } });

    jest.advanceTimersByTime(60000);
    await Promise.resolve();

    expect(channel.send).not.toHaveBeenCalled();
  });

  test('does not record bot messages', async () => {
    await startAmbientEngine(client);
    trackChannelActivity({ author: { bot: true }, channel: { id: '1' } });

    jest.advanceTimersByTime(60000);
    await Promise.resolve();

    expect(channel.send).not.toHaveBeenCalled();
  });

  test('requires minMessagesSinceLast', async () => {
    AmbientSetting.findOne.mockResolvedValue({ minMessagesSinceLast: 2, freshWindowMs: 120000 });
    await startAmbientEngine(client);
    trackChannelActivity({ author: { bot: false }, channel: { id: '1' } });

    jest.advanceTimersByTime(60000);
    await Promise.resolve();

    expect(channel.send).not.toHaveBeenCalled();
  });

  test('handles empty ambient message list', async () => {
    AmbientMessage.findAll.mockResolvedValue([]);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await startAmbientEngine(client);
    trackChannelActivity({ author: { bot: false }, channel: { id: '1' } });

    jest.advanceTimersByTime(60000);
    await Promise.resolve();

    expect(channel.send).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('⚠️ No ambient messages available in DB.');
    warnSpy.mockRestore();
  });

  test('logs error when loading allowed channels fails', async () => {
    AmbientChannel.findAll.mockRejectedValue(new Error('db fail'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await startAmbientEngine(client);

    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Failed to load allowed ambient channels:',
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  test('warns when ambient settings missing', async () => {
    AmbientSetting.findOne.mockResolvedValue(null);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await startAmbientEngine(client);

    expect(warnSpy).toHaveBeenCalledWith(
      '⚠️ No ambient settings found in DB. Using defaults.'
    );
    warnSpy.mockRestore();
  });

  test('logs error when ambient settings load fails', async () => {
    AmbientSetting.findOne.mockRejectedValue(new Error('db fail'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await startAmbientEngine(client);

    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Failed to load ambient settings:',
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  test('skips non-text based channels', async () => {
    channel.isTextBased = () => false;
    await startAmbientEngine(client);
    trackChannelActivity({ author: { bot: false }, channel: { id: '1' } });

    jest.advanceTimersByTime(60000);
    await Promise.resolve();

    expect(channel.send).not.toHaveBeenCalled();
  });

  test('logs error when message send fails', async () => {
    channel.send.mockRejectedValue(new Error('net fail'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await startAmbientEngine(client);
    trackChannelActivity({ author: { bot: false }, channel: { id: '1' } });

    jest.advanceTimersByTime(60000);
    await jest.runOnlyPendingTimersAsync();
    expect(channel.send).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
