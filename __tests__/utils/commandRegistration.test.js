jest.mock('../../config.json', () => ({ clientId: '1', guildId: '2', token: '3' }), { virtual: true });

const fs = require('fs');
const path = require('path');
const { loadCommandsRecursively } = require('../../utils/commandRegistration');

describe('loadCommandsRecursively', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(__dirname, 'cmds'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test('loads valid command files', () => {
    const content = `module.exports = { data: { name: 'ping', toJSON() { return {name: 'ping'}; } } };`;
    fs.writeFileSync(path.join(tempDir, 'ping.js'), content);

    const { commandList, commandMap } = loadCommandsRecursively(tempDir);
    expect(commandList).toEqual([{ name: 'ping' }]);
    expect(commandMap.get('ping')).toBeDefined();
  });

  test('skips invalid command files without throwing', () => {
    fs.writeFileSync(path.join(tempDir, 'bad.js'), 'module.exports = {}');
    const { commandList, commandMap } = loadCommandsRecursively(tempDir);
    expect(commandList).toEqual([]);
    expect(commandMap.size).toBe(0);
  });
});
