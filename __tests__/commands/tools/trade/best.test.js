jest.mock('../../../../utils/trade/tradeHandlers', () => ({
  handleTradeBest: jest.fn(),
  handleTradeBestCore: jest.fn(() => ({ embed: {} })),
}));
jest.mock('../../../../utils/trade/handlers/shared');
jest.mock('../../../../config/database', () => ({ UexVehicle: { findByPk: jest.fn() } }));

const { handleTradeBest, handleTradeBestCore } = require('../../../../utils/trade/tradeHandlers');
const shared = require('../../../../utils/trade/handlers/shared');
const { UexVehicle } = require('../../../../config/database');
const command = require('../../../../commands/tools/trade/best');

beforeEach(() => {
  jest.clearAllMocks();
});

test('execute caches state and calls handler', async () => {
  const interaction = {
    user: { id: '1', tag: 't' },
    options: {
      getString: jest.fn(key => (key === 'from' ? 'A' : 'B')),
      getInteger: jest.fn(() => null),
    },
  };

  await command.execute(interaction, {});
  expect(shared.TradeStateCache.set).toHaveBeenCalledWith('1', { fromLocation: 'A', shipQuery: 'B', cash: null });
  expect(handleTradeBest).toHaveBeenCalledWith(interaction, {}, { fromLocation: 'A', shipQuery: 'B', cash: null });
});

test('option processes ship selection', async () => {
  const interaction = {
    customId: 'trade::best::select_ship',
    values: ['1'],
    user: { id: '1', tag: 't' },
    deferUpdate: jest.fn(),
  };
  shared.TradeStateCache.get.mockReturnValue({ fromLocation: 'A', shipQuery: 'B', cash: null });
  UexVehicle.findByPk.mockResolvedValue({ id: '1' });

  await command.option(interaction, {});

  expect(UexVehicle.findByPk).toHaveBeenCalledWith('1', { raw: true });
  expect(handleTradeBestCore).toHaveBeenCalled();
  expect(shared.safeReply).toHaveBeenCalled();
});

