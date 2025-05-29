jest.mock('../../services/lavalink');
jest.mock('../../services/spotify');
jest.mock('../../services/youtube');

let lavalink = require('../../services/lavalink');
let spotify = require('../../services/spotify');
let youtube = require('../../services/youtube');
let audio;

describe('audioManager', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // re-require mocks after resetting modules
    jest.mock('../../services/lavalink');
    jest.mock('../../services/spotify');
    jest.mock('../../services/youtube');
    lavalink = require('../../services/lavalink');
    spotify = require('../../services/spotify');
    youtube = require('../../services/youtube');
    audio = require('../../services/audioManager');
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

  test('falls back to stream when lavalink fails for YouTube URL', async () => {
    lavalink.loadTrack
      .mockRejectedValueOnce(new Error('sig'))
      .mockResolvedValueOnce({ tracks: [{ track: 't1', info: { title: 'Song' } }] });
    youtube.getStreamUrl = jest.fn().mockResolvedValue('http://stream');
    await audio.enqueue('g', 'https://youtube.com/watch?v=1');
    expect(youtube.getStreamUrl).toHaveBeenCalledWith('https://youtube.com/watch?v=1');
    expect(lavalink.loadTrack).toHaveBeenLastCalledWith('http://stream');
  });

  test('propagates when fallback fails', async () => {
    lavalink.loadTrack.mockRejectedValue(new Error('sig'));
    youtube.getStreamUrl = jest.fn().mockRejectedValue(new Error('bad'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(audio.enqueue('g', 'https://youtu.be/x')).rejects.toThrow('Failed to load track');
    expect(youtube.getStreamUrl).toHaveBeenCalledWith('https://youtu.be/x');
    errSpy.mockRestore();
  });

  test('join reuses existing connection', () => {
    jest.doMock('@discordjs/voice', () => ({
      joinVoiceChannel: jest.fn(() => ({ joinConfig: { channelId: 'c1' }, destroyed: false, destroy: jest.fn() }))
    }), { virtual: true });
    audio = require('../../services/audioManager');
    const { joinVoiceChannel } = require('@discordjs/voice');
    const conn1 = audio.join('g', 'c1', 'a');
    const conn2 = audio.join('g', 'c1', 'a');
    expect(joinVoiceChannel).toHaveBeenCalledTimes(1);
    expect(conn1).toBe(conn2);
    jest.dontMock('@discordjs/voice');
  });

  test('join switches channels', () => {
    jest.doMock('@discordjs/voice', () => ({
      joinVoiceChannel: jest.fn(() => ({ joinConfig: { channelId: 'c1' }, destroyed: false, destroy: jest.fn() }))
    }), { virtual: true });
    audio = require('../../services/audioManager');
    const { joinVoiceChannel } = require('@discordjs/voice');
    const conn1 = audio.join('g', 'c1', 'a');
    joinVoiceChannel.mockReturnValueOnce({ joinConfig: { channelId: 'c2' }, destroyed: false, destroy: jest.fn() });
    const conn2 = audio.join('g', 'c2', 'a');
    expect(conn1.destroy).toHaveBeenCalled();
    expect(joinVoiceChannel).toHaveBeenCalledTimes(2);
    expect(conn2.joinConfig.channelId).toBe('c2');
    jest.dontMock('@discordjs/voice');
  });
});
