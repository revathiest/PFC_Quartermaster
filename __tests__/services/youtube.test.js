const path = '../../services/youtube';

describe('youtube service', () => {
  let execFile;
  beforeEach(() => {
    jest.resetModules();
    execFile = jest.fn();
    jest.doMock('child_process', () => ({ execFile }));
  });

  afterEach(() => {
    jest.dontMock('child_process');
  });

  test('returns webpage url from yt-dlp output', async () => {
    const json = JSON.stringify({ webpage_url: 'https://yt/watch?v=1', url: 'https://cdn.example/v=1' });
    execFile.mockImplementation((cmd, args, cb) => cb(null, json));
    const youtube = require(path);
    const res = await youtube.search('test');
    expect(execFile).toHaveBeenCalledWith(expect.any(String), ['-j', 'ytsearch1:test'], expect.any(Function));
    expect(res).toBe('https://yt/watch?v=1');
  });

  test('rejects on exec error', async () => {
    const err = new Error('fail');
    execFile.mockImplementation((cmd, args, cb) => cb(err));
    const youtube = require(path);
    await expect(youtube.search('bad')).rejects.toThrow(err);
  });
});
