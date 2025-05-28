const spotifyPath = '../../services/spotify';

describe('spotify service', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('retries auth when unauthorized', async () => {
    const mockJson = jest.fn().mockResolvedValue({ items: [] });
    global.fetch = jest
      .fn()
      // initial token fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 't1' }) })
      // first playlist request unauthorized
      .mockResolvedValueOnce({ ok: false, status: 401 })
      // refresh token
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 't2' }) })
      // successful playlist request
      .mockResolvedValueOnce({ ok: true, json: mockJson });
    const spotify = require(spotifyPath);
    spotify._resetAuth();
    await spotify.getPlaylistTracks('id');
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  test('returns data on success', async () => {
    const data = { items: [1] };
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 't1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => data });
    const spotify = require(spotifyPath);
    spotify._resetAuth();
    const res = await spotify.getPlaylistTracks('id');
    expect(res).toEqual(data);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
