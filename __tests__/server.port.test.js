jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(() => '')
}));

jest.mock('../db', () => ({ sequelize: {} }));
const mockFindOne = jest.fn();
jest.mock('../models/siteContent', () => jest.fn(() => ({ findOne: mockFindOne })));
jest.mock('../config.json', () => ({ clientId: 'id', clientSecret: 'secret', callbackURL: 'url' }), { virtual: true });

jest.mock('http', () => {
  return {
    createServer: jest.fn(() => ({
      listen: jest.fn((port, cb) => cb && cb())
    }))
  };
});
jest.mock('https', () => ({ createServer: jest.fn() }));
jest.mock('greenlock-express', () => {
  const serve = jest.fn();
  return { init: jest.fn(() => ({ serve })), _serve: serve };
});

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('uses greenlock on port 80', () => {
  process.env.PORT = '80';
  const { startServer } = require('../server');
  startServer();
  const http = require('http');
  const gl = require('greenlock-express');
  expect(gl.init).toHaveBeenCalledWith(expect.objectContaining({ packageRoot: expect.any(String) }));
  expect(gl._serve).toHaveBeenCalledWith(expect.any(Function));
  expect(http.createServer).not.toHaveBeenCalled();
  delete process.env.PORT;
});

