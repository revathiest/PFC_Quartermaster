jest.mock('../../../../utils/trade/tradeQueries', () => ({}));
const { handleTradeBestCircuit } = require('../../../../utils/trade/handlers/bestCircuit');

describe('handleTradeBestCircuit', () => {
  test('exports function', () => {
    expect(typeof handleTradeBestCircuit).toBe('function');
  });
});
