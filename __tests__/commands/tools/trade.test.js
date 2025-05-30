jest.mock('../../../utils/trade/tradeHandlers', () => ({ safeReply: jest.fn() }));

const { safeReply } = require('../../../utils/trade/tradeHandlers');

jest.mock('../../../commands/tools/trade/best', () => ({ execute: jest.fn(), option: jest.fn(), button: jest.fn(), data: jest.fn(() => ({ name: 'best' })) }));
const bestPath = require.resolve('../../../commands/tools/trade/best');

const trade = require('../../../commands/tools/trade');

afterEach(() => jest.clearAllMocks());

test('executes subcommand module', async () => {
  const interaction = { options: { getSubcommand: jest.fn(() => 'best') } };
  const mod = require(bestPath);
  await trade.execute(interaction, {});
  expect(mod.execute).toHaveBeenCalledWith(interaction, {});
});

test('handles missing subcommand module', async () => {
  const interaction = { options: { getSubcommand: jest.fn(() => 'missing') } };
  await trade.execute(interaction, {});
  expect(safeReply).toHaveBeenCalled();
});

test('option routes to subcommand handler', async () => {
  const interaction = { customId: 'trade::best::x', deferUpdate: jest.fn() };
  const mod = require(bestPath);
  await trade.option(interaction, {});
  expect(mod.option).toHaveBeenCalledWith(interaction, {});
});

test('button routes to subcommand handler', async () => {
  const interaction = { customId: 'trade_best_select::whatever', deferUpdate: jest.fn() };
  const mod = require(bestPath);
  await trade.button(interaction, {});
  expect(mod.button).toHaveBeenCalledWith(interaction, {});
});

