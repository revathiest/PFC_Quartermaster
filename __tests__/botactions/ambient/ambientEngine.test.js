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

  beforeEach(() => {
    jest.clearAllMocks();
    channel = { isTextBased: () => true, name: 'general', send: jest.fn() };
    client = { channels: { cache: new Map([['1', channel]]) } };
    AmbientChannel.findAll.mockResolvedValue([{ channelId: '1' }]);
    AmbientSetting.findOne.mockResolvedValue({ minMessagesSinceLast: 1, freshWindowMs: 120000 });
    AmbientMessage.findAll.mockResolvedValue([{ content: 'hi' }]);
  });

  afterEach(() => {
    jest.useRealTimers();
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
    await startAmbientEngine(client);
    trackChannelActivity({ author: { bot: false }, channel: { id: '1' } });

    jest.advanceTimersByTime(60000);
    await Promise.resolve();

    expect(channel.send).not.toHaveBeenCalled();
  });
});
