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
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SIGNING_SECRET;
  });

  test('returns new token for valid jwt', () => {
    const token = sign({ id: 1 }, 'signer');
    const req = { body: { token } };
    const res = mockRes();
    exchangeToken(req, res);
    const newToken = res.json.mock.calls[0][0].token;
    expect(verify(newToken, 'server')).toEqual({ id: 1 });
  });

  test('rejects missing token', () => {
    const req = { body: {} };
    const res = mockRes();
    exchangeToken(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
  });

  test('rejects invalid token', () => {
    const bad = sign({ id: 1 }, 'bad');
    const req = { body: { token: bad } };
    const res = mockRes();
    exchangeToken(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  test('returns 500 when secrets missing', () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SIGNING_SECRET;
    const req = { body: { token: 'x' } };
    const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exchangeToken(req, res);
    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server misconfiguration' });
    spy.mockRestore();
  });
});
