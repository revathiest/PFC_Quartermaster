jest.mock('../../services/lavalink');
jest.mock('../../services/spotify');
jest.mock('../../services/youtube');

const lavalink = require('../../services/lavalink');
const spotify = require('../../services/spotify');
const youtube = require('../../services/youtube');
const audio = require('../../services/audioManager');

describe('audioManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    audio._clear();
    lavalink.loadTrack.mockResolvedValue({ tracks: [{ track: 't1', info: { title: 'Song' } }] });
    spotify.getPlaylistTracks.mockResolvedValue({ items: [] });
    spotify.getTrack.mockResolvedValue({ name: 'Track', artists: [{ name: 'Artist' }] });
    youtube.search.mockResolvedValue('yturl');
  });

  test('enqueue loads and plays when queue empty', async () => {
    await audio.enqueue('guild', 'query');
    expect(youtube.search).toHaveBeenCalledWith('query');
    expect(lavalink.loadTrack).toHaveBeenCalledWith('yturl');
    expect(lavalink.play).toHaveBeenCalledWith('guild', 't1');
    expect(audio.getQueue('guild')).toHaveLength(1);
  });

  test('skip advances queue and stops when empty', async () => {
    await audio.enqueue('guild', 'q1');
    lavalink.loadTrack.mockResolvedValue({ tracks: [{ track: 't2', info: { title: 's2' } }] });
    await audio.enqueue('guild', 'q2');
    lavalink.play.mockClear();

    await audio.skip('guild');
    expect(lavalink.play).toHaveBeenCalledWith('guild', 't2');
    expect(audio.getQueue('guild')).toHaveLength(1);

    await audio.skip('guild');
    expect(lavalink.stop).toHaveBeenCalledWith('guild');
    expect(audio.getQueue('guild')).toHaveLength(0);
  });

  test('enqueue propagates errors', async () => {
    lavalink.loadTrack.mockRejectedValue(new Error('fail'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(audio.enqueue('guild', 'bad')).rejects.toThrow('Failed to load track');
    expect(youtube.search).toHaveBeenCalledWith('bad');
    expect(audio.getQueue('guild')).toHaveLength(0);
    expect(lavalink.play).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith('❌ Failed to load track:', 'fail');
    errSpy.mockRestore();
  });

  test('loads spotify playlist via youtube', async () => {
    spotify.getPlaylistTracks.mockResolvedValue({
      items: [
        { track: { name: 'Song1', artists: [{ name: 'A1' }] } },
        { track: { name: 'Song2', artists: [{ name: 'A2' }] } }
      ]
    });
    youtube.search
      .mockResolvedValueOnce('u1')
      .mockResolvedValueOnce('u2');
    await audio.enqueue('g', 'https://open.spotify.com/playlist/x');
    expect(youtube.search).toHaveBeenCalledTimes(2);
    expect(lavalink.loadTrack).toHaveBeenCalledWith('u1');
    expect(lavalink.loadTrack).toHaveBeenCalledWith('u2');
    expect(audio.getQueue('g')).toHaveLength(2);
    expect(lavalink.play).toHaveBeenCalledWith('g', 't1');
  });

  test('loads spotify track link', async () => {
    spotify.getTrack.mockResolvedValue({ name: 'Solo', artists: [{ name: 'Artist' }] });
    youtube.search.mockResolvedValue('yt');
    await audio.enqueue('id', 'https://open.spotify.com/track/abc');
    expect(spotify.getTrack).toHaveBeenCalledWith('abc');
    expect(youtube.search).toHaveBeenCalledWith('Solo Artist');
    expect(lavalink.loadTrack).toHaveBeenCalledWith('yt');
    expect(lavalink.play).toHaveBeenCalledWith('id', 't1');
  });

  test('uses query directly when URL provided', async () => {
    await audio.enqueue('id', 'https://youtube.com/watch?v=123');
    expect(youtube.search).not.toHaveBeenCalled();
    expect(lavalink.loadTrack).toHaveBeenCalledWith('https://youtube.com/watch?v=123');
  });
});
