jest.mock('../../services/lavalink');

const lavalink = require('../../services/lavalink');
const audio = require('../../services/audioManager');

describe('audioManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    audio._clear();
    lavalink.loadTrack.mockResolvedValue({ tracks: [{ track: 't1', info: { title: 'Song' } }] });
  });

  test('enqueue loads and plays when queue empty', async () => {
    await audio.enqueue('guild', 'query');
    expect(lavalink.loadTrack).toHaveBeenCalledWith('query');
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
    expect(audio.getQueue('guild')).toHaveLength(0);
    expect(lavalink.play).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith('❌ Failed to load track:', 'fail');
    errSpy.mockRestore();
  });
});
