const fs = require('fs');

jest.mock('fs');

const { loadConfiguration } = require('../../botactions/configLoader');

describe('loadConfiguration', () => {
  test('reads and parses config file', () => {
    fs.readFileSync.mockReturnValue('{"token":"1"}');
    const res = loadConfiguration();
    expect(fs.readFileSync.mock.calls[0][0]).toContain('config.json');
    expect(res).toEqual({ token: '1' });
  });
});
