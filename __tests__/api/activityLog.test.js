jest.mock('../../config/database', () => ({ UsageLog: { findAll: jest.fn() } }));
jest.mock('../../discordClient', () => ({ getClient: jest.fn() }));
jest.mock('../../config.json', () => ({ guildId: 'g1' }), { virtual: true });

const { Op } = require('sequelize');
const {
  searchLogs,
  searchLogsPost
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
