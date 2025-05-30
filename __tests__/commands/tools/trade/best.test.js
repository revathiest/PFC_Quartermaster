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
const { MessageFlags } = require('../../../../__mocks__/discord.js');

let logSpy;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
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

test('option handles missing cached state', async () => {
  const interaction = {
    customId: 'trade::best::select_ship',
    values: ['1'],
    user: { id: '1', tag: 't' },
    deferUpdate: jest.fn()
  };
  shared.TradeStateCache.get.mockReturnValue(undefined);

  await command.option(interaction, {});

  expect(interaction.deferUpdate).toHaveBeenCalled();
});

test('data defines command structure', () => {
  const data = command.data();
  const names = data.options.map(o => o.name);
  expect(data.name).toBe('best');
  expect(names).toEqual(['from', 'with', 'cash']);
  expect(data.options.find(o => o.name === 'from').required).toBe(true);
});

test('option ignores unrelated select menus', async () => {
  const interaction = {
    customId: 'other::menu',
    values: [],
    user: { id: '1', tag: 't' },
    deferUpdate: jest.fn()
  };
  await command.option(interaction, {});
  expect(shared.TradeStateCache.get).not.toHaveBeenCalled();
  expect(UexVehicle.findByPk).not.toHaveBeenCalled();
  expect(shared.safeReply).not.toHaveBeenCalled();
});

test('option replies when ship not found', async () => {
  const interaction = {
    customId: 'trade::best::select_ship',
    values: ['7'],
    user: { id: '1', tag: 't' },
    deferUpdate: jest.fn()
  };
  shared.TradeStateCache.get.mockReturnValue({ fromLocation: 'L', shipQuery: 'Q', cash: null });
  UexVehicle.findByPk.mockResolvedValue(null);

  await command.option(interaction, {});

  expect(shared.safeReply).toHaveBeenCalledWith(interaction, {
    content: '❌ Could not find the selected ship.',
    flags: MessageFlags.Ephemeral
  });
  expect(handleTradeBestCore).not.toHaveBeenCalled();
});

test('option forwards error from handler', async () => {
  const interaction = {
    customId: 'trade::best::select_ship',
    values: ['1'],
    user: { id: '1', tag: 't' },
    deferUpdate: jest.fn()
  };
  shared.TradeStateCache.get.mockReturnValue({ fromLocation: 'A', shipQuery: 'B', cash: 5 });
  UexVehicle.findByPk.mockResolvedValue({ id: '1' });
  handleTradeBestCore.mockResolvedValueOnce({ error: 'boom' });

  await command.option(interaction, {});

  expect(shared.safeReply).toHaveBeenCalledWith(interaction, {
    content: 'boom',
    flags: MessageFlags.Ephemeral
  });
});

test('option sends components when provided', async () => {
  const interaction = {
    customId: 'trade::best::select_ship',
    values: ['1'],
    user: { id: '1', tag: 't' },
    deferUpdate: jest.fn()
  };
  shared.TradeStateCache.get.mockReturnValue({ fromLocation: 'A', shipQuery: 'B', cash: 5 });
  UexVehicle.findByPk.mockResolvedValue({ id: '1' });
  const row = { type: 1 };
  handleTradeBestCore.mockResolvedValueOnce({ components: [row], content: 'select' });

  await command.option(interaction, {});

  expect(shared.safeReply).toHaveBeenCalledWith(interaction, {
    content: 'select',
    components: [row],
    flags: MessageFlags.Ephemeral
  });
});

