const { discordLogin } = require('../../api/login');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

jest.mock('node-fetch');
jest.mock('../../discordClient', () => ({ getClient: jest.fn() }));
jest.mock('../../config.json', () => ({ guildId: 'g1' }), { virtual: true });

const { getClient } = require('../../discordClient');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('api/login discordLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DISCORD_CLIENT_ID = 'id';
    process.env.DISCORD_CLIENT_SECRET = 'secret';
    process.env.JWT_SECRET = 'jwt';
    const guild = {
      members: {
        fetch: jest.fn().mockResolvedValue({ displayName: 'Tester', roles: { cache: [{ name: 'Admin' }] } })
      }
    };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } } });
  });

  afterEach(() => {
    delete process.env.DISCORD_CLIENT_ID;
    delete process.env.DISCORD_CLIENT_SECRET;
    delete process.env.JWT_SECRET;
  });

  test('returns token for valid code', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'acc' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1', username: 'A' }) });
    const req = { body: { code: 'abc', redirectUri: 'http://x' } };
    const res = mockRes();
    await discordLogin(req, res);
    const token = res.json.mock.calls[0][0].token;
    const decoded = jwt.verify(token, 'jwt');
    expect(decoded).toMatchObject({
      id: '1',
      username: 'A',
      displayName: 'Tester',
      roles: ['Admin']
    });
    expect(decoded.exp - decoded.iat).toBe(1800);
  });

  test('returns 400 when missing data', async () => {
    const req = { body: {} };
    const res = mockRes();
    await discordLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing code or redirectUri' });
  });

  test('returns 403 on invalid code', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 400 });
    const req = { body: { code: 'bad', redirectUri: 'http://x' } };
    const res = mockRes();
    await discordLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid code' });
  });

  test('returns 500 when client missing', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'acc' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1', username: 'A' }) });
    getClient.mockReturnValueOnce(null);
    const req = { body: { code: 'abc', redirectUri: 'http://x' } };
    const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await discordLogin(req, res);
    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Discord client unavailable' });
    spy.mockRestore();
  });
});
