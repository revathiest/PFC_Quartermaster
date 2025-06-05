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
  return express;
}, { virtual: true });

jest.mock('cors', () => jest.fn(() => (req, res, next) => next()), { virtual: true });

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
    expect(app.use).toHaveBeenCalled();
    expect(app.get).toHaveBeenCalledWith('/api/data', expect.any(Function));
    expect(app.listen).toHaveBeenCalledWith(25566, expect.any(Function));
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
