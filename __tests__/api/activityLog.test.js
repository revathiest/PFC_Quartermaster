jest.mock('../../config/database', () => ({
  UsageLog: { findAll: jest.fn() },
  sequelize: { fn: jest.fn((name, col) => `${name}(${col})`), col: jest.fn(name => name) }
}));
jest.mock('../../discordClient', () => ({ getClient: jest.fn() }));
jest.mock('../../config.json', () => ({ guildId: 'g1' }), { virtual: true });

const { Op } = require('sequelize');
const {
  searchLogs,
  searchLogsPost,
  listEventTypes
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

describe('api/activityLog listEventTypes', () => {
  test('returns event type list', async () => {
    const req = {};
    const res = mockRes();
    UsageLog.findAll.mockResolvedValue([
      { get: field => (field === 'event_type' ? 'a' : undefined) },
      { get: field => (field === 'event_type' ? 'b' : undefined) }
    ]);

    await listEventTypes(req, res);

    expect(UsageLog.findAll).toHaveBeenCalledWith({
      attributes: [['DISTINCT(event_type)', 'event_type']],
      where: { server_id: 'g1' }
    });
    expect(res.json).toHaveBeenCalledWith({ eventTypes: ['a', 'b'] });
  });

  test('handles errors', async () => {
    const req = {};
    const res = mockRes();
    UsageLog.findAll.mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listEventTypes(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});
