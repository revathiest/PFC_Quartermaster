const express = jest.fn(() => {
  const server = { on: jest.fn() };
  const app = {
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn((port, cb) => { if (cb) cb(); return server; })
  };
  app.__server = server;
  return app;
});
module.exports = express;
