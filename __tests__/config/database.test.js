jest.mock('../../config/database', () => require('../../__mocks__/config/database'));

const { initializeDatabase, sequelize } = require('../../config/database'); // Adjust this path!

describe('initializeDatabase', () => {
  let mockConsoleLog, mockConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock all model sync methods dynamically
    Object.values(sequelize.models).forEach(model => {
      model.sync = jest.fn().mockResolvedValue(); // Default successful sync
    });

    // Spy on console logs
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('syncs all models successfully', async () => {
    await initializeDatabase();

    Object.entries(sequelize.models).forEach(([modelName, model]) => {
      expect(model.sync).toHaveBeenCalledWith({ alter: false });
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining(`📦 Synced model: ${modelName}`));
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✅ All models synchronized'));
  });

  it('logs an error for a model that fails to sync', async () => {
    const error = new Error('Test sync failure');
    const failingModelName = Object.keys(sequelize.models)[0];
    sequelize.models[failingModelName].sync.mockRejectedValueOnce(error);

    await initializeDatabase();

    expect(mockConsoleError).toHaveBeenCalledWith(
      `❌ Failed to sync model: ${failingModelName}`,
      error
    );
  });

  it('logs global error if synchronization loop fails completely', async () => {
    const breakingError = new Error('Catastrophic failure');
    const originalEntries = Object.entries;

    // Break the for-loop itself
    jest.spyOn(Object, 'entries').mockImplementationOnce(() => {
      throw breakingError;
    });

    await initializeDatabase();

    expect(mockConsoleError).toHaveBeenCalledWith('❌ Unable to synchronize the database:', breakingError);

    // Restore Object.entries afterward to avoid breaking other tests
    Object.entries = originalEntries;
  });
});
