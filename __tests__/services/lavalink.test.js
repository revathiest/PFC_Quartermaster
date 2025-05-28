const path = require('path');
const config = require('../../config/lavalink.json');

describe('lavalink service config fallback', () => {
  const originalEnv = { ...process.env };
  let lavalink;

  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    delete global.fetch;
  });

  test('uses config file when env vars missing', async () => {
    delete process.env.LAVALINK_HOST;
    delete process.env.LAVALINK_PORT;
    delete process.env.LAVALINK_PASSWORD;

    lavalink = require('../../services/lavalink');
    await lavalink.loadTrack('song');

    expect(global.fetch).toHaveBeenCalledWith(
      `http://${config.host}:${config.port}/loadtracks?identifier=song`,
      expect.objectContaining({ headers: { Authorization: config.password } })
    );
  });

  test('uses environment variables when provided', async () => {
    process.env.LAVALINK_HOST = 'envhost';
    process.env.LAVALINK_PORT = '9999';
    process.env.LAVALINK_PASSWORD = 'secret';

    lavalink = require('../../services/lavalink');
    await lavalink.loadTrack('track');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://envhost:9999/loadtracks?identifier=track',
      expect.objectContaining({ headers: { Authorization: 'secret' } })
    );
  });

  test('throws error when fetch fails', async () => {
    global.fetch.mockRejectedValue(new Error('connect error'));
    lavalink = require('../../services/lavalink');
    await expect(lavalink.loadTrack('bad')).rejects.toThrow('Lavalink connection failed');
  });
});
