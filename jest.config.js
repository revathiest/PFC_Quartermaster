module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    // Force any import of 'discord.js' to use your custom mock
    '^discord.js$': '<rootDir>/__mocks__/discord.js',
    // Optional: mock image/static imports if needed
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // === COVERAGE SETTINGS ===
  collectCoverage: true,                        // always gather coverage
  coverageDirectory: 'coverage',               // output folder
  coverageReporters: ['text', 'lcov'],         // text = console table, lcov for HTML
  collectCoverageFrom: [
    'utils/**/*.{js,ts}',
    'commands/**/*.{js,ts}',
    'botactions/**/*.{js,ts}',
    'jobs/**/*.{js,ts}',
    'models/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/__mocks__/**'
  ],

  verbose: true
};
