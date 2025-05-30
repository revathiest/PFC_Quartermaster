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
    channel.messages.fetch.mockResolvedValue(msgs);
    channel.messages.fetch.mockRejectedValueOnce({ code: 10008 });
    db.SnapChannel.findAll.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 1 }]);
    const p = deleteMessages(client);
    jest.runAllTimers();
    await p;
    expect(channel.messages.fetch).toHaveBeenCalled();
  });
  test('logs error and continues when DB fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.SnapChannel.findAll.mockRejectedValue(new Error('db fail'));

    const p = deleteMessages(client);
    jest.runAllTimers();
    await p;

    expect(errorSpy).toHaveBeenCalled();
    expect(client.channels.fetch).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
