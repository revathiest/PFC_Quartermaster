const fs = require('fs');
const os = require('os');
const path = require('path');

const { deleteOldLogs } = require('../../../botactions/maintenance/logCleanup');

describe('deleteOldLogs', () => {
  let tempDir;
  let consoleLogSpy;
  let consoleErrorSpy;
  const dayMs = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logtest-'));
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
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
});
