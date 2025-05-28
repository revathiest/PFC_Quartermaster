const { formatTime, formatDuration, getChannelNameById, getGuildNameById, getUserNameById } = require('../../botactions/utilityFunctions');

describe('utilityFunctions', () => {
  describe('formatTime', () => {
    test('formats milliseconds into hh:mm:ss', () => {
      expect(formatTime(3661000)).toBe('01:01:01');
    });
  });

  describe('formatDuration', () => {
    test('formats milliseconds into human readable string', () => {
      const oneDay = 24 * 60 * 60 * 1000;
      const ms = oneDay * 2 + 3 * 60 * 60 * 1000 + 4 * 60 * 1000 + 5 * 1000;
      expect(formatDuration(ms)).toBe('2d 03h 04m 05s');
    });
  });

  describe('getChannelNameById', () => {
    let client;
    beforeEach(() => {
      client = {
        channels: {
          fetch: jest.fn()
        }
      };
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns channel name when found', async () => {
      client.channels.fetch.mockResolvedValue({ name: 'general' });
      await expect(getChannelNameById('123', client)).resolves.toBe('general');
    });

    test('throws error when channel not found', async () => {
      client.channels.fetch.mockResolvedValue(null);
      await expect(getChannelNameById('123', client)).rejects.toThrow('Channel with ID 123 not found.');
    });

    test('propagates fetch errors', async () => {
      const err = new Error('fail');
      client.channels.fetch.mockRejectedValue(err);
      await expect(getChannelNameById('123', client)).rejects.toThrow('fail');
    });
  });

  describe('getGuildNameById', () => {
    let client;
    beforeEach(() => {
      client = { guilds: { fetch: jest.fn() } };
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns guild name when found', async () => {
      client.guilds.fetch.mockResolvedValue({ name: 'guild' });
      await expect(getGuildNameById('1', client)).resolves.toBe('guild');
    });

    test('throws error when guild not found', async () => {
      client.guilds.fetch.mockResolvedValue(undefined);
      await expect(getGuildNameById('1', client)).rejects.toThrow('Guild with ID 1 not found.');
    });

    test('propagates fetch errors', async () => {
      const err = new Error('bad');
      client.guilds.fetch.mockRejectedValue(err);
      await expect(getGuildNameById('1', client)).rejects.toThrow('bad');
    });
  });

  describe('getUserNameById', () => {
    let client;
    beforeEach(() => {
      client = { users: { fetch: jest.fn() } };
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns username when found', async () => {
      client.users.fetch.mockResolvedValue({ username: 'bob' });
      await expect(getUserNameById('1', client)).resolves.toBe('bob');
    });

    test('throws error when user not found', async () => {
      client.users.fetch.mockResolvedValue(null);
      await expect(getUserNameById('1', client)).rejects.toThrow('User with ID 1 not found.');
    });

    test('propagates fetch errors', async () => {
      const err = new Error('oops');
      client.users.fetch.mockRejectedValue(err);
      await expect(getUserNameById('1', client)).rejects.toThrow('oops');
    });
  });
});
