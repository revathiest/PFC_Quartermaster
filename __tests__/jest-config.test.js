const config = require('../jest.config');

describe('jest configuration', () => {
  test('has expected basic settings', () => {
    expect(config.testEnvironment).toBe('node');
    expect(config.roots).toContain('<rootDir>/__tests__');
    expect(config.moduleNameMapper['^discord.js$']).toBe('<rootDir>/__mocks__/discord.js');
    expect(config.collectCoverage).toBe(true);
    expect(config.coverageDirectory).toBe('coverage');
    expect(config.collectCoverageFrom).toEqual(
      expect.arrayContaining([
        'utils/**/*.{js,ts}',
        'commands/**/*.{js,ts}',
        'botactions/**/*.{js,ts}',
        'jobs/**/*.{js,ts}',
        'models/**/*.{js,ts}'
      ])
    );
  });
});
