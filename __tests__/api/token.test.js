const { exchangeToken } = require('../../api/token');
const { sign, verify } = require('../../utils/jwt');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('api/token exchangeToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'server';
    process.env.JWT_SIGNING_SECRET = 'signer';
    process.env.TOKEN_IP_WHITELIST = '1.1.1.1';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SIGNING_SECRET;
    delete process.env.TOKEN_IP_WHITELIST;
  });

  test('returns new token for valid jwt', () => {
    const token = sign({ id: 1 }, 'signer');
    const req = { body: { token }, ip: '1.1.1.1' };
    const res = mockRes();
    exchangeToken(req, res);
    const newToken = res.json.mock.calls[0][0].token;
    expect(verify(newToken, 'server')).toEqual({ id: 1 });
  });

  test('rejects missing token', () => {
    const req = { body: {}, ip: '1.1.1.1' };
    const res = mockRes();
    exchangeToken(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
  });

  test('rejects invalid token', () => {
    const bad = sign({ id: 1 }, 'bad');
    const req = { body: { token: bad }, ip: '1.1.1.1' };
    const res = mockRes();
    exchangeToken(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  test('returns 500 when secrets missing', () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SIGNING_SECRET;
    const req = { body: { token: 'x' }, ip: '1.1.1.1' };
    const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exchangeToken(req, res);
    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server misconfiguration' });
    spy.mockRestore();
  });

  test('rejects unauthorized ip', () => {
    const token = sign({ id: 1 }, 'signer');
    const req = { body: { token }, ip: '2.2.2.2' };
    const res = mockRes();
    exchangeToken(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized IP' });
  });

  test('returns 500 when whitelist missing', () => {
    delete process.env.TOKEN_IP_WHITELIST;
    const token = sign({ id: 1 }, 'signer');
    const req = { body: { token }, ip: '1.1.1.1' };
    const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exchangeToken(req, res);
    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server misconfiguration' });
    spy.mockRestore();
  });
});
