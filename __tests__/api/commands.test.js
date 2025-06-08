jest.mock('../../discordClient', () => ({ getClient: jest.fn() }));
jest.mock('../../config.json', () => ({ guildId: 'g1' }), { virtual: true });

const { listCommands, getCommand } = require('../../api/commands');
const { getClient } = require('../../discordClient');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('api/commands listCommands', () => {
  test('returns command list', async () => {
    const guild = { members: { fetch: jest.fn() } };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } }, commands: new Map([['ping', {}], ['trade', {}]]) });
    const req = {};
    const res = mockRes();

    await listCommands(req, res);
    expect(res.json).toHaveBeenCalledWith({ commands: ['ping', 'trade'] });
  });

  test('returns 500 when client missing', async () => {
    getClient.mockReturnValue(null);
    const req = {};
    const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listCommands(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Discord client unavailable' });
    spy.mockRestore();
  });
});

describe('api/commands getCommand', () => {
  test('returns command info', async () => {
    const guild = { members: { fetch: jest.fn() } };
    const cmd = { data: { name: 'ping', description: 'desc' }, aliases: ['pong'], cooldown: 5 };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } }, commands: new Map([['ping', cmd]]) });
    const req = { params: { command: 'ping' } };
    const res = mockRes();

    await getCommand(req, res);

    expect(res.json).toHaveBeenCalledWith({ command: { command: 'ping', description: 'desc', aliases: ['pong'], cooldown: '5s' } });
  });

  test('returns 404 when missing', async () => {
    const guild = { members: { fetch: jest.fn() } };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } }, commands: new Map() });
    const req = { params: { command: 'x' } };
    const res = mockRes();

    await getCommand(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  test('returns 500 when client missing', async () => {
    getClient.mockReturnValue(null);
    const req = { params: { command: 'ping' } };
    const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getCommand(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Discord client unavailable' });
    spy.mockRestore();
  });
});
