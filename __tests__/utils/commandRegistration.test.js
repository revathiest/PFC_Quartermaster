jest.mock('../../config.json', () => ({ clientId: '1', guildId: '2', token: '3' }), { virtual: true });

const fs = require('fs');
const path = require('path');

// --- mocks for REST and Routes
jest.mock('@discordjs/rest', () => {
  const restPutMock = jest.fn();
  const setTokenMock = jest.fn(() => ({ put: restPutMock }));
  const RESTMock = jest.fn(() => ({ setToken: setTokenMock }));
  return { REST: RESTMock, __mocks__: { restPutMock, setTokenMock, RESTMock } };
});

jest.mock('discord-api-types/v10', () => {
  const appGuildCmdMock = jest.fn(() => 'route');
  return { Routes: { applicationGuildCommands: appGuildCmdMock }, __mocks__: { appGuildCmdMock } };
});

let registerCommands, loadCommandsRecursively;
let restMocks, routeMocks;

describe('loadCommandsRecursively', () => {
  let tempDir;

  beforeEach(() => {
    jest.resetModules();
    ({ loadCommandsRecursively } = require('../../utils/commandRegistration'));
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

describe('registerCommands', () => {
  let tempDir;

  beforeEach(() => {
    jest.resetModules();
    ({ registerCommands } = require('../../utils/commandRegistration'));
    ({ __mocks__: restMocks } = require('@discordjs/rest'));
    ({ __mocks__: routeMocks } = require('discord-api-types/v10'));
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    tempDir = fs.mkdtempSync(path.join(__dirname, 'cmds-reg'));
    const commandContent = `module.exports = { data: { name: 't', toJSON(){ return { name: 't' }; } } };`;
    fs.writeFileSync(path.join(tempDir, 't.js'), commandContent);

    const registrationDir = path.dirname(require.resolve('../../utils/commandRegistration'));
    const originalJoin = path.join;
    jest.spyOn(path, 'join').mockImplementation((first, second, ...rest) => {
      if (first === registrationDir && second === '../commands') {
        return tempDir;
      }
      return originalJoin(first, second, ...rest);
    });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test('registers commands and updates client', async () => {
    restMocks.restPutMock.mockResolvedValue([{}]);
    const client = {};

    await registerCommands(client);

    const expectedPath = path.join(__dirname, '../../commands');
    expect(client.commands.has('t')).toBe(true);
    expect(restMocks.RESTMock).toHaveBeenCalledWith({ version: '10' });
    expect(restMocks.setTokenMock).toHaveBeenCalledWith('3');
    expect(routeMocks.appGuildCmdMock).toHaveBeenCalledWith('1', '2');
    expect(restMocks.restPutMock).toHaveBeenCalledWith('route', { body: [{ name: 't' }] });
    expect(console.error).not.toHaveBeenCalled();
  });

  test('logs error when registration fails', async () => {
    restMocks.restPutMock.mockRejectedValue(new Error('fail'));
    const client = {};

    await registerCommands(client);

    expect(console.error).toHaveBeenCalledWith(
      '❌ Discord registration failed:',
      expect.any(Error)
    );
  });
});
