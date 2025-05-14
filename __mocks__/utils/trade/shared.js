module.exports = {
    safeReply: jest.fn(),
  
    TradeStateCache: {
      set: jest.fn(),
      get: jest.fn(() => null),
      delete: jest.fn()
    }
  };
  