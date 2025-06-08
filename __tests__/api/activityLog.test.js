jest.mock('../../config/database', () => ({ UsageLog: { findAll: jest.fn() } }));
jest.mock('../../discordClient', () => ({ getClient: jest.fn() }));
jest.mock('../../config.json', () => ({ guildId: 'g1' }), { virtual: true });

const { Op } = require('sequelize');
const {
  searchLogs,
  searchLogsPost,
  listCommands,
  getCommand,
  listMembers,
  getMember
} = require('../../api/activityLog');
const { UsageLog } = require('../../config/database');
const { getClient } = require('../../discordClient');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

const makeCollection = arr => ({ map: fn => arr.map(fn) });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('api/activityLog searchLogs', () => {
  test('returns logs with filters', async () => {
    const req = { query: { page: '2', limit: '1', type: 'LOGIN', userId: 'u1', command: 'ping', message: 'hi' } };
    const res = mockRes();
    UsageLog.findAll.mockResolvedValue(['x']);

    await searchLogs(req, res);

    expect(UsageLog.findAll).toHaveBeenCalledWith({
      where: {
        server_id: 'g1',
        event_type: 'LOGIN',
        user_id: 'u1',
        command_name: 'ping',
        message_content: { [Op.like]: '%hi%' }
      },
      limit: 1,
      offset: 1,
      order: [['timestamp', 'DESC']]
    });
    expect(res.json).toHaveBeenCalledWith({ logs: ['x'] });
  });

  test('handles errors', async () => {
    const req = { query: {} };
    const res = mockRes();
    UsageLog.findAll.mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await searchLogs(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});

describe('api/activityLog searchLogsPost', () => {
  test('returns logs using body', async () => {
    const req = { body: { page: 1, limit: 2, filters: { command: 'trade' } } };
    const res = mockRes();
    UsageLog.findAll.mockResolvedValue(['y']);

    await searchLogsPost(req, res);

    expect(UsageLog.findAll).toHaveBeenCalledWith({
      where: { server_id: 'g1', command_name: 'trade' },
      limit: 2,
      offset: 0,
      order: [['timestamp', 'DESC']]
    });
    expect(res.json).toHaveBeenCalledWith({ logs: ['y'] });
  });
});

describe('api/activityLog listCommands', () => {
  test('returns command list', async () => {
    const guild = { members: { fetch: jest.fn() } };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } }, commands: new Map([['ping', {}], ['trade', {}]]) });
    const req = {};
    const res = mockRes();

    await listCommands(req, res);
    expect(res.json).toHaveBeenCalledWith({ commands: ['/ping', '/trade'] });
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

describe('api/activityLog getCommand', () => {
  test('returns command info', async () => {
    const guild = { members: { fetch: jest.fn() } };
    const cmd = { data: { name: 'ping', description: 'desc' }, aliases: ['pong'], cooldown: 5 };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } }, commands: new Map([['ping', cmd]]) });
    const req = { params: { command: 'ping' } };
    const res = mockRes();

    await getCommand(req, res);

    expect(res.json).toHaveBeenCalledWith({ command: { command: '/ping', description: 'desc', aliases: ['pong'], cooldown: '5s' } });
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
});

describe('api/activityLog listMembers', () => {
  test('returns members', async () => {
    const members = [
      { id: '1', user: { username: 'A' } },
      { id: '2', user: { username: 'B' } }
    ];
    const guild = { members: { fetch: jest.fn().mockResolvedValue(), cache: makeCollection(members) } };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } } });
    const req = {};
    const res = mockRes();

    await listMembers(req, res);

    expect(guild.members.fetch).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ members: [{ userId: '1', username: 'A' }, { userId: '2', username: 'B' }] });
  });

  test('handles errors', async () => {
    const guild = { members: { fetch: jest.fn().mockRejectedValue(new Error('fail')), cache: makeCollection([]) } };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } } });
    const req = {};
    const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listMembers(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});

describe('api/activityLog getMember', () => {
  test('returns member info', async () => {
    const member = {
      id: '1',
      user: { username: 'A' },
      joinedAt: new Date('2023-01-01'),
      roles: { cache: [{ name: 'R' }] },
      presence: { status: 'online' }
    };
    const guild = { members: { fetch: jest.fn().mockResolvedValue(member) } };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } } });
    const req = { params: { userId: '1' } };
    const res = mockRes();

    await getMember(req, res);

    expect(guild.members.fetch).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({
      member: {
        userId: '1',
        username: 'A',
        joinDate: '2023-01-01',
        roles: ['R'],
        isActive: true
      }
    });
  });

  test('returns 404 when missing', async () => {
    const guild = { members: { fetch: jest.fn().mockRejectedValue(new Error('fail')) } };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } } });
    const req = { params: { userId: 'x' } };
    const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getMember(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
    spy.mockRestore();
  });
});
