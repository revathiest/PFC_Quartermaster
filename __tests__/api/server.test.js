jest.mock('express', () => {
  const express = jest.fn(() => {
    const server = { on: jest.fn() };
    const app = {
      use: jest.fn(),
      get: jest.fn(),
      listen: jest.fn((port, cb) => {
        if (cb) cb();
        return server;
      })
    };
    app.__server = server;
    return app;
  });
  express.Router = jest.fn(() => ({
    get: jest.fn(),
    use: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }));
  express.json = jest.fn(() => (req, res, next) => next());
  return express;
}, { virtual: true });

jest.mock('cors', () => jest.fn(() => (req, res, next) => next()), { virtual: true });

jest.mock('../../config/database', () => ({ SiteContent: {}, Event: {}, Accolade: {} }));
jest.mock('../../config.json', () => ({ guildId: 'g1' }), { virtual: true });
jest.mock('../../api/docs', () => ({ router: {} }), { virtual: true });
jest.mock('../../api/auth', () => ({
  authMiddleware: jest.fn((req, res, next) => next()),
  requireServerAdmin: jest.fn((req, res, next) => next())
}));

const express = require('express');
const { startApi } = require('../../api/server');

describe('api/server startApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('starts server and registers route', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    startApi();
    const app = express.mock.results[0].value;
    expect(app.use).toHaveBeenCalledWith('/api/login', expect.anything());
    expect(app.use).toHaveBeenCalledWith('/api/docs', expect.anything());
    expect(app.use).toHaveBeenCalledWith('/api', expect.any(Function));
    expect(app.use).toHaveBeenCalledWith('/api/activity-log', expect.anything());
    expect(app.use).toHaveBeenCalledWith('/api/content', expect.anything());
    expect(app.use).toHaveBeenCalledWith('/api/events', expect.anything());
    expect(app.use).toHaveBeenCalledWith('/api/officers', expect.anything());
    expect(app.use).toHaveBeenCalledWith('/api/members', expect.anything());
    expect(app.get).toHaveBeenCalledWith('/api/data', expect.any(Function));
    expect(app.listen).toHaveBeenCalledWith(8003, expect.any(Function));
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test('logs warning on port in use', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    startApi();
    const app = express.mock.results[0].value;
    const server = app.__server;
    const errorHandler = server.on.mock.calls[0][1];
    errorHandler({ code: 'EADDRINUSE' });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
