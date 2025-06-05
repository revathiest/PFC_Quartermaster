const fs = require('fs');
const path = require('path');

const mockFindOne = jest.fn();
jest.mock('../db', () => ({ sequelize: {} }));
jest.mock('../models/siteContent', () => jest.fn(() => ({ findOne: mockFindOne })));
jest.mock('../config.json', () => ({ clientId: 'id', clientSecret: 'secret', callbackURL: 'url' }), { virtual: true });

let server;
let port;
let logSpy;
let warnSpy;
let errorSpy;

beforeEach(async () => {
  jest.resetModules();
  fs.mkdirSync(path.join(__dirname, '../public/.well-known/acme-challenge'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '../public/.well-known/acme-challenge/test'), 'challenge');
  process.env.HTTP_ONLY = 'true';
  const { app } = require('../server');
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  port = server.address().port;
});

afterEach(done => {
  server.close(() => done());
  fs.rmSync(path.join(__dirname, '../public'), { recursive: true, force: true });
  delete process.env.HTTP_ONLY;
  logSpy.mockRestore();
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

test('serves acme challenge over HTTP', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/.well-known/acme-challenge/test`);
  const text = await res.text();
  expect(res.status).toBe(200);
  expect(text).toBe('challenge');
});
