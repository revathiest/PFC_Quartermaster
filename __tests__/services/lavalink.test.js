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
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    lavalink = require('../../services/lavalink');
    await expect(lavalink.loadTrack('bad')).rejects.toThrow('Lavalink connection failed');
    expect(errSpy).toHaveBeenCalledWith('❌ Lavalink connection failed:', 'connect error');
    errSpy.mockRestore();
  });

  test('logs status when response not ok', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    lavalink = require('../../services/lavalink');
    await expect(lavalink.loadTrack('bad')).rejects.toThrow('Failed to load track');
    expect(errSpy).toHaveBeenCalledWith('⚠️ Lavalink responded with status', 500);
    errSpy.mockRestore();
  });

  test('falls back to node-fetch when global fetch missing', async () => {
    jest.resetModules();
    jest.doMock('node-fetch', () => jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    delete global.fetch;

    lavalink = require('../../services/lavalink');
    const nodeFetch = require('node-fetch');

    await lavalink.loadTrack('song');

    expect(nodeFetch).toHaveBeenCalledWith(
      `http://${config.host}:${config.port}/loadtracks?identifier=song`,
      expect.objectContaining({ headers: { Authorization: config.password } })
    );

    jest.dontMock('node-fetch');
  });
});

describe('lavalink local spawning', () => {
  let spawnMock;
  beforeEach(() => {
    jest.resetModules();
    spawnMock = jest.fn(() => ({ stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn(), kill: jest.fn() }));
    jest.doMock('child_process', () => ({ spawn: spawnMock }));
    process.env.SPAWN_LOCAL_LAVALINK = 'true';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  afterEach(() => {
    jest.dontMock('child_process');
    delete process.env.SPAWN_LOCAL_LAVALINK;
    delete global.fetch;
  });

  test('spawns lavalink when env var set', () => {
    require('../../services/lavalink');
    expect(spawnMock).toHaveBeenCalledWith(
      'java',
      [
        '-Xmx512M',
        '-jar',
        expect.stringContaining(path.join('lavalink', 'Lavalink.jar')),
      ],
      expect.objectContaining({ cwd: expect.stringContaining('lavalink'), detached: true })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `http://${config.host}:${config.port}/version`,
      expect.objectContaining({ headers: { Authorization: config.password } })
    );
  });
});

describe('waitForLavalink', () => {
  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('resolves when server responds', async () => {
    const { waitForLavalink } = require('../../services/lavalink');
    await expect(waitForLavalink(1, 0)).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      `http://${config.host}:${config.port}/version`,
      expect.objectContaining({ headers: { Authorization: config.password } })
    );
  });

  test('rejects after retries', async () => {
    global.fetch.mockRejectedValue(new Error('down'));
    const { waitForLavalink } = require('../../services/lavalink');
    await expect(waitForLavalink(2, 1)).rejects.toThrow('Lavalink not reachable');
  });
});
