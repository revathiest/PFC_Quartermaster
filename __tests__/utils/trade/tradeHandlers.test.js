
jest.mock('../../../utils/trade/handlers/best', () => ({ handleTradeBest: jest.fn(), handleTradeBestCore: jest.fn() }));
jest.mock('../../../utils/trade/handlers/bestCircuit', () => ({ handleTradeBestCircuit: jest.fn() }));
jest.mock('../../../utils/trade/handlers/route', () => ({ handleTradeRoute: jest.fn() }));
jest.mock('../../../utils/trade/handlers/find', () => ({ handleTradeFind: jest.fn() }));
jest.mock('../../../utils/trade/handlers/price', () => ({ handleTradePrice: jest.fn() }));
jest.mock('../../../utils/trade/handlers/ship', () => ({ handleTradeShip: jest.fn() }));
jest.mock('../../../utils/trade/handlers/locations', () => ({ handleTradeLocations: jest.fn() }));
jest.mock('../../../utils/trade/handlers/commodities', () => ({ handleTradeCommodities: jest.fn() }));
jest.mock('../../../utils/trade/handlers/shared', () => ({ safeReply: jest.fn(), pendingBest: {} }));

const handlersBest = require('../../../utils/trade/handlers/best');
const handlersBestCircuit = require('../../../utils/trade/handlers/bestCircuit');
const handlersRoute = require('../../../utils/trade/handlers/route');
const handlersFind = require('../../../utils/trade/handlers/find');
const handlersPrice = require('../../../utils/trade/handlers/price');
const handlersShip = require('../../../utils/trade/handlers/ship');
const handlersLocations = require('../../../utils/trade/handlers/locations');
const handlersCommodities = require('../../../utils/trade/handlers/commodities');
const shared = require('../../../utils/trade/handlers/shared');

jest.mock('../../../utils/trade/handlers/best', () => ({ handleTradeBest: jest.fn(), handleTradeBestCore: jest.fn() }));
jest.mock('../../../utils/trade/handlers/bestCircuit', () => ({ handleTradeBestCircuit: jest.fn() }));
jest.mock('../../../utils/trade/handlers/route', () => ({ handleTradeRoute: jest.fn() }));
jest.mock('../../../utils/trade/handlers/find', () => ({ handleTradeFind: jest.fn() }));
jest.mock('../../../utils/trade/handlers/price', () => ({ handleTradePrice: jest.fn() }));
jest.mock('../../../utils/trade/handlers/ship', () => ({ handleTradeShip: jest.fn() }));
jest.mock('../../../utils/trade/handlers/locations', () => ({ handleTradeLocations: jest.fn() }));
jest.mock('../../../utils/trade/handlers/commodities', () => ({ handleTradeCommodities: jest.fn() }));
jest.mock('../../../utils/trade/handlers/shared', () => ({ safeReply: jest.fn(), pendingBest: {}, }));

const tradeHandlers = require('../../../utils/trade/tradeHandlers');

describe('tradeHandlers exports', () => {
  test('re-exports all handler functions', () => {
    expect(tradeHandlers).toMatchObject({
      handleTradeBest: handlersBest.handleTradeBest,
      handleTradeBestCore: handlersBest.handleTradeBestCore,
      handleTradeBestCircuit: handlersBestCircuit.handleTradeBestCircuit,
      handleTradeRoute: handlersRoute.handleTradeRoute,
      handleTradeFind: handlersFind.handleTradeFind,
      handleTradePrice: handlersPrice.handleTradePrice,
      handleTradeShip: handlersShip.handleTradeShip,
      handleTradeLocations: handlersLocations.handleTradeLocations,
      handleTradeCommodities: handlersCommodities.handleTradeCommodities,
      safeReply: shared.safeReply,
      pendingBest: shared.pendingBest,
    });
  });
});
