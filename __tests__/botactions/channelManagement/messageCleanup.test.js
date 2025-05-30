jest.useFakeTimers();

jest.mock('../../../config/database', () => ({
  SnapChannel: {
    findAll: jest.fn()
  }
}));

const db = require('../../../config/database');
const { deleteMessages } = require('../../../botactions/channelManagement/messageCleanup');

describe('deleteMessages', () => {
  let client;
  let channel;

  beforeEach(() => {
    jest.clearAllMocks();
    channel = {
      id: 'c1',
      name: 'chan',
      type: 0,
      permissionsFor: () => ({ has: () => true }),
      messages: { fetch: jest.fn() },
      bulkDelete: jest.fn()
    };
    client = {
      user: { id: 'bot', tag: 'bot#0001' },
      guilds: { cache: new Map([['g1', { name: 'guild', id: 'g1' }]]) },
      channels: { fetch: jest.fn().mockResolvedValue(channel) }
    };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('deletes eligible messages', async () => {
    const now = Date.now();
    const makeCollection = entries => {
      const col = new Map(entries);
      col.filter = fn => makeCollection([...col].filter(([id, m]) => fn(m)));
      return col;
    };
    const msgs = makeCollection([
      ['1', { id: '1', pinned: false, createdTimestamp: now - 2 * 86400000, author: { tag: 'a', id: 'u' } }],
      ['2', { id: '2', pinned: false, createdTimestamp: now - 20 * 86400000, delete: jest.fn(), author: { tag: 'a', id: 'u' } }]
    ]);
    channel.messages.fetch.mockResolvedValueOnce(msgs).mockRejectedValueOnce({ code: 10008 });
    db.SnapChannel.findAll.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 1 }]);
    const p = deleteMessages(client);
    await jest.runAllTimersAsync();
    await p;
    expect(channel.messages.fetch).toHaveBeenCalled();
  });
  test('logs error and continues when DB fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.SnapChannel.findAll.mockRejectedValue(new Error('db fail'));

    const p = deleteMessages(client);
    await jest.runAllTimersAsync();
    await p;

    expect(errorSpy).toHaveBeenCalled();
    expect(client.channels.fetch).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('handles channel fetch failure gracefully', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.SnapChannel.findAll.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 1 }]);
    client.channels.fetch.mockRejectedValue(new Error('nope'));

    const p = deleteMessages(client);
    await jest.runAllTimersAsync();
    await p;

    expect(errorSpy).toHaveBeenCalled();
    expect(channel.messages.fetch).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('skips unsupported channel types', async () => {
    db.SnapChannel.findAll.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 1 }]);
    client.channels.fetch.mockResolvedValue({ id: 'c1', type: 2 });

    const p = deleteMessages(client);
    await jest.runAllTimersAsync();
    await p;

    expect(client.channels.fetch).toHaveBeenCalledWith('c1');
    expect(channel.messages.fetch).not.toHaveBeenCalled();
  });

  test('deletes very old messages individually', async () => {
    const now = Date.now();
    const makeCollection = entries => {
      const col = new Map(entries);
      col.filter = fn => makeCollection([...col].filter(([id, m]) => fn(m)));
      return col;
    };
    const oldMsg = { id: '2', pinned: false, createdTimestamp: now - 20 * 86400000, delete: jest.fn(), author: { tag: 'a', id: 'u' } };
    const msgs = makeCollection([
      ['2', oldMsg]
    ]);
    channel.messages.fetch
      .mockResolvedValueOnce(msgs)
      .mockRejectedValueOnce({ code: 10008 });
    db.SnapChannel.findAll.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 1 }]);

    const p = deleteMessages(client);
    await jest.runAllTimersAsync();
    await p;

    expect(oldMsg.delete).toHaveBeenCalled();
    expect(channel.bulkDelete).not.toHaveBeenCalled();
  });

  test('warns when message still exists after delete', async () => {
    const now = Date.now();
    const makeCollection = entries => {
      const col = new Map(entries);
      col.filter = fn => makeCollection([...col].filter(([id, m]) => fn(m)));
      return col;
    };
    const oldMsg = {
      id: '1',
      pinned: false,
      createdTimestamp: now - 20 * 86400000,
      delete: jest.fn(),
      author: { tag: 'a', id: 'u' }
    };
    const msgs = makeCollection([['1', oldMsg]]);
    channel.messages.fetch
      .mockResolvedValueOnce(msgs)
      .mockResolvedValueOnce(oldMsg);
    db.SnapChannel.findAll.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 1 }]);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const p = deleteMessages(client);
    await jest.runAllTimersAsync();
    await p;

    expect(oldMsg.delete).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('still exists'));
    warnSpy.mockRestore();
  });

  test('handles delete errors for permission and ghost cases', async () => {
    const now = Date.now();
    const makeCollection = entries => {
      const col = new Map(entries);
      col.filter = fn => makeCollection([...col].filter(([id, m]) => fn(m)));
      return col;
    };
    const msg1 = {
      id: '1',
      pinned: false,
      createdTimestamp: now - 20 * 86400000,
      delete: jest.fn().mockRejectedValue({ code: 50013 }),
      author: { tag: 'a', id: 'u' }
    };
    const msg2 = {
      id: '2',
      pinned: false,
      createdTimestamp: now - 20 * 86400000,
      delete: jest.fn().mockRejectedValue({ code: 10008 }),
      author: { tag: 'a', id: 'u' }
    };
    const msgs = makeCollection([
      ['1', msg1],
      ['2', msg2]
    ]);
    channel.messages.fetch.mockResolvedValueOnce(msgs);
    db.SnapChannel.findAll.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 1 }]);

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const p = deleteMessages(client);
    await jest.runAllTimersAsync();
    await p;

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing permissions'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('ghost'));
    errorSpy.mockRestore();
  });

  test('logs error when fetching messages fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.SnapChannel.findAll.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 1 }]);
    channel.messages.fetch.mockRejectedValue(new Error('oops'));

    const p = deleteMessages(client);
    await jest.runAllTimersAsync();
    await p;

    expect(errorSpy).toHaveBeenCalled();
    expect(channel.bulkDelete).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('logs when no messages are found to delete', async () => {
    const makeCollection = entries => {
      const col = new Map(entries);
      col.filter = fn => makeCollection([...col].filter(([id, m]) => fn(m)));
      return col;
    };
    const msgs = makeCollection([]);
    channel.messages.fetch.mockResolvedValueOnce(msgs);
    db.SnapChannel.findAll.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 1 }]);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const p = deleteMessages(client);
    await jest.runAllTimersAsync();
    await p;

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No messages to delete'));
    expect(channel.bulkDelete).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
