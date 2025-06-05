const mockFindOne = jest.fn();
jest.mock('../db', () => ({ sequelize: {} }));
jest.mock('../models/siteContent', () => jest.fn(() => ({ findOne: mockFindOne })));
jest.mock('../config.json', () => ({ clientId: 'id', clientSecret: 'secret', callbackURL: 'url' }), { virtual: true });

let app;
let server;
let port;
let logSpy;
let warnSpy;
let errorSpy;

beforeEach(async () => {
  jest.resetModules();
  mockFindOne.mockReset();
  ({ app } = require('../server'));
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  port = server.address().port;
});

afterEach((done) => {
  server.close(() => done());
  logSpy.mockRestore();
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe('GET /api/content/:section', () => {
  test('returns content when found', async () => {
    mockFindOne.mockResolvedValue({ section: 'home', content: 'hello' });
    const res = await fetch(`http://127.0.0.1:${port}/api/content/home`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ section: 'home', content: 'hello' });
  });

  test('returns 404 when content missing', async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await fetch(`http://127.0.0.1:${port}/api/content/missing`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Content not found' });
  });

  test('returns 500 on error', async () => {
    mockFindOne.mockRejectedValue(new Error('db fail'));
    const res = await fetch(`http://127.0.0.1:${port}/api/content/home`);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Internal server error' });
  });
});
