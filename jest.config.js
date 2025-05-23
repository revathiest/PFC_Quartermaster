module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/__tests__'],
    moduleFileExtensions: ['js', 'json'],
    moduleDirectories: ['node_modules', '<rootDir>'],
    moduleNameMapper: {
      // Force any import of 'discord.js' to use your custom mock
      '^discord.js$': '<rootDir>/__mocks__/discord.js',
      // Optional: mock image/static imports if needed
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    collectCoverageFrom: [
      'utils/**/*.js',
      '!**/node_modules/**',
      '!**/__mocks__/**'
    ],
    verbose: true
  };
  