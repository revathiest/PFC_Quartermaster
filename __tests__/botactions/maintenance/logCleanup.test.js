const fs = require('fs');
const os = require('os');
const path = require('path');

const { deleteOldLogs } = require('../../../botactions/maintenance/logCleanup');

describe('deleteOldLogs', () => {
  let tempDir;
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;
  const dayMs = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logtest-'));
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('removes files older than the provided threshold', async () => {
    const oldFile = path.join(tempDir, 'old.log');
    const newFile = path.join(tempDir, 'new.log');

    fs.writeFileSync(oldFile, 'old');
    fs.writeFileSync(newFile, 'new');

    const now = Date.now();
    const oldDate = new Date(now - 10 * dayMs);
    const newDate = new Date(now);

    fs.utimesSync(oldFile, oldDate, oldDate);
    fs.utimesSync(newFile, newDate, newDate);

    deleteOldLogs(tempDir, 7);

    await new Promise((r) => setTimeout(r, 100));

    const remaining = fs.readdirSync(tempDir);
    expect(remaining).toContain('new.log');
    expect(remaining).not.toContain('old.log');
  });

  it('logs an error if readdir fails', async () => {
    const spy = jest.spyOn(fs, 'readdir').mockImplementation((_, cb) => cb(new Error('fail')));

    deleteOldLogs(tempDir, 7);

    await new Promise(r => setTimeout(r, 50));
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to read log directory:', expect.any(Error));

    spy.mockRestore();
  });

  it('logs a warning if stat fails for a file', async () => {
    const badFile = path.join(tempDir, 'bad.log');
    fs.writeFileSync(badFile, 'data');

    const statSpy = jest.spyOn(fs, 'stat').mockImplementationOnce((_, cb) => cb(new Error('stat fail')));

    deleteOldLogs(tempDir, 7);

    await new Promise(r => setTimeout(r, 50));

    expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ Could not stat file: bad.log', expect.any(Error));
    expect(fs.existsSync(badFile)).toBe(true);

    statSpy.mockRestore();
  });

  it('logs an error if file deletion fails', async () => {
    const oldFile = path.join(tempDir, 'old.log');
    fs.writeFileSync(oldFile, 'old');

    const oldDate = new Date(Date.now() - 10 * dayMs);
    fs.utimesSync(oldFile, oldDate, oldDate);

    const unlinkSpy = jest.spyOn(fs, 'unlink').mockImplementationOnce((_, cb) => cb(new Error('unlink fail')));

    deleteOldLogs(tempDir, 7);

    await new Promise(r => setTimeout(r, 50));

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to delete old.log', expect.any(Error));
    expect(fs.existsSync(oldFile)).toBe(true);

    unlinkSpy.mockRestore();
  });
});
