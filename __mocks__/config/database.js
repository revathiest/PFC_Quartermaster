// __mocks__/config/database.js


const VerificationCode = {
  upsert: jest.fn(),
  findOne: jest.fn()
};

const VerifiedUser = {
  findOne: jest.fn(),
  upsert: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  findOrCreate: jest.fn()
};

const OrgTag = {
  findByPk: jest.fn(),
  findAll: jest.fn()
};

const UsageLog = {
  create: jest.fn(),
  findAll: jest.fn()
};

const VoiceLog = {
  findAll: jest.fn()
};

// Simple mock Sequelize-like instance
const sequelize = {
  models: {
    MockModelA: { sync: jest.fn() },
    MockModelB: { sync: jest.fn() },
    MockModelC: { sync: jest.fn() },
  },
  fn: jest.fn((name, col) => `${name}(${col})`),
  col: jest.fn(name => name),
  literal: jest.fn(value => value)
};

/**
 * Mimics the real initializeDatabase function by calling `sync` on each model
 * and logging status messages. The real implementation iterates over all
 * models and attempts to sync them with the database.
 */
async function initializeDatabase() {
  try {
    for (const [modelName, model] of Object.entries(sequelize.models)) {
      try {
        await model.sync({ alter: false });
        console.log(`📦 Synced model: ${modelName}`);
      } catch (modelError) {
        console.error(`❌ Failed to sync model: ${modelName}`, modelError);
      }
    }

    console.log('✅ All models synchronized');
  } catch (error) {
    console.error('❌ Unable to synchronize the database:', error);
  }
}

module.exports = {
  VerificationCode,
  VerifiedUser,
  OrgTag,
  UsageLog,
  VoiceLog,
  sequelize,
  initializeDatabase
};
