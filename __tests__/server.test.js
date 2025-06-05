const fs = require('fs');

jest.mock('../db', () => ({ sequelize: {} }));
const mockFindOne = jest.fn();
jest.mock('../models/siteContent', () => jest.fn(() => ({ findOne: mockFindOne })));
jest.mock('../config.json', () => ({ clientId: 'id', clientSecret: 'secret', callbackURL: 'url' }), { virtual: true });

jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((port, cb) => cb && cb())
  }))
}));

jest.mock('https', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((port, cb) => cb && cb())
  }))
}));

jest.mock('greenlock-express', () => ({
  init: jest.fn(() => ({ serve: jest.fn() }))
}));

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.HTTP_ONLY;
  jest.spyOn(fs, 'existsSync').mockReturnValue(false);
  jest.spyOn(fs, 'readFileSync').mockReturnValue('');
});

afterEach(() => {
  jest.resetModules();
});

describe('server startup modes', () => {
  test('starts HTTP server when HTTP_ONLY is true', () => {
    process.env.HTTP_ONLY = 'true';
    const { startServer } = require('../server');
    startServer();
    const http = require('http');
    const https = require('https');
    const greenlock = require('greenlock-express');

    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).not.toHaveBeenCalled();
    expect(greenlock.init).not.toHaveBeenCalled();
  });

  test('starts HTTPS server when certs exist', () => {
    fs.existsSync.mockReturnValue(true);
    const { startServer } = require('../server');
    startServer();
    const https = require('https');
    const http = require('http');
    const greenlock = require('greenlock-express');

    expect(https.createServer).toHaveBeenCalled();
    expect(http.createServer).not.toHaveBeenCalled();
    expect(greenlock.init).not.toHaveBeenCalled();
  });

  test('falls back to greenlock when no certs', () => {
    const { startServer } = require('../server');
    startServer();
    const greenlock = require('greenlock-express');
    const http = require('http');
    const https = require('https');

    expect(greenlock.init).toHaveBeenCalled();
    expect(http.createServer).not.toHaveBeenCalled();
    expect(https.createServer).not.toHaveBeenCalled();
  });
});
