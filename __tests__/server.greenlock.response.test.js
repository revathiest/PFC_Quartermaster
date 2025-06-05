const fs = require('fs');

jest.mock('../db', () => ({ sequelize: {} }));
const mockFindOne = jest.fn();
jest.mock('../models/siteContent', () => jest.fn(() => ({ findOne: mockFindOne })));
jest.mock('../config.json', () => ({ clientId: 'id', clientSecret: 'secret', callbackURL: 'url' }), { virtual: true });

let server;
let port;
let logSpy;
let warnSpy;
let errorSpy;

jest.mock('greenlock-express', () => ({
  init: jest.fn(() => ({
    serve: (app) => {
      server = app.listen(0);
    }
  }))
}));

beforeEach(async () => {
  jest.resetModules();
  mockFindOne.mockReset();
  jest.spyOn(fs, 'existsSync').mockReturnValue(false);
  jest.spyOn(fs, 'readFileSync').mockReturnValue('');
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const { startServer } = require('../server');
  startServer();
  await new Promise(resolve => server.once('listening', resolve));
  port = server.address().port;
});

afterEach(done => {
  server.close(() => done());
  logSpy.mockRestore();
  warnSpy.mockRestore();
  errorSpy.mockRestore();
  jest.restoreAllMocks();
});

test('greenlock serves application responses', async () => {
  mockFindOne.mockResolvedValue({ section: 'home', content: 'hello' });
  const res = await fetch(`http://127.0.0.1:${port}/api/content/home`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data).toEqual({ section: 'home', content: 'hello' });
  const greenlock = require('greenlock-express');
  expect(greenlock.init).toHaveBeenCalled();
});
