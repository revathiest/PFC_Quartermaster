jest.mock('../../config/database', () => ({ Accolade: { findAll: jest.fn() } }));
jest.mock('../../discordClient', () => ({ getClient: jest.fn() }));
jest.mock('../../config.json', () => ({ guildId: 'g1' }), { virtual: true });

const { listAccolades } = require('../../api/accolades');
const { Accolade } = require('../../config/database');
const { getClient } = require('../../discordClient');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

const makeCollection = arr => ({
  filter: fn => makeCollection(arr.filter(fn)),
  map: fn => arr.map(fn)
});

describe('api/accolades listAccolades', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('returns accolades with recipients', async () => {
    const req = {};
    const res = mockRes();
    Accolade.findAll.mockResolvedValue([
      { id: 1, role_id: 'r1', name: 'A' },
      { id: 2, role_id: 'r2', name: 'B' }
    ]);

    const members = [
      { id: 'u1', displayName: 'Alice', roles: { cache: [{ id: 'r1' }] } },
      { id: 'u2', displayName: 'Bob', roles: { cache: [{ id: 'r2' }] } },
      { id: 'u3', displayName: 'Charlie', roles: { cache: [] } }
    ];
    const guild = { members: { fetch: jest.fn().mockResolvedValue(), cache: makeCollection(members) } };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } } });

    await listAccolades(req, res);

    expect(Accolade.findAll).toHaveBeenCalled();
    expect(guild.members.fetch).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      accolades: [
        { id: 1, role_id: 'r1', name: 'A', recipients: [{ id: 'u1', displayName: 'Alice' }] },
        { id: 2, role_id: 'r2', name: 'B', recipients: [{ id: 'u2', displayName: 'Bob' }] }
      ]
    });
  });

  test('handles database errors', async () => {
    const req = {};
    const res = mockRes();
    const err = new Error('fail');
    Accolade.findAll.mockRejectedValue(err);
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => ({ members: { fetch: jest.fn(), cache: makeCollection([]) } })) } } });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listAccolades(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });

  test('returns 500 when client missing', async () => {
    const req = {};
    const res = mockRes();
    Accolade.findAll.mockResolvedValue([]);
    getClient.mockReturnValue(null);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listAccolades(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Discord client unavailable' });
    spy.mockRestore();
  });
});
