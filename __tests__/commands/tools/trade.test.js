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

test('button ignores unrelated ids', async () => {
  const interaction = { customId: 'other', deferUpdate: jest.fn() };
  await trade.button(interaction, {});
  expect(safeReply).not.toHaveBeenCalled();
});

test('option missing handler sends warning', async () => {
  jest.resetModules();
  jest.mock('../../../commands/tools/trade/missing', () => ({}), { virtual: true });
  const interaction = { customId: 'trade::missing', deferUpdate: jest.fn() };
  await trade.option(interaction, {});
  expect(safeReply).toHaveBeenCalled();
});

test('execute handles require error', async () => {
  const interaction = { options: { getSubcommand: jest.fn(() => 'missingErr') } };
  await trade.execute(interaction, {});
  expect(safeReply).toHaveBeenCalled();
});

test('initialization warns for invalid subcommand file', () => {
  jest.resetModules();
  jest.doMock('fs', () => ({ readdirSync: () => ['bad.js'] }));
  jest.mock('../../../commands/tools/trade/bad.js', () => ({}), { virtual: true });
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  jest.isolateModules(() => {
    require('../../../commands/tools/trade');
  });

  jest.unmock('fs');

  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

test('button missing handler sends warning', async () => {
  jest.resetModules();
  jest.doMock('../../../commands/tools/trade/badbtn', () => ({}), { virtual: true });
  jest.doMock('../../../utils/trade/tradeHandlers', () => ({ safeReply: jest.fn() }));
  const { safeReply: mockReply } = require('../../../utils/trade/tradeHandlers');
  const interaction = { customId: 'trade_badbtn_select::x', deferUpdate: jest.fn() };
  await require('../../../commands/tools/trade').button(interaction, {});
  expect(mockReply).toHaveBeenCalled();
});

test('button require error handled', async () => {
  jest.resetModules();
  jest.doMock('../../../utils/trade/tradeHandlers', () => ({ safeReply: jest.fn() }));
  const { safeReply: mockReply } = require('../../../utils/trade/tradeHandlers');
  const interaction = { customId: 'trade_err_select::x', deferUpdate: jest.fn() };
  await require('../../../commands/tools/trade').button(interaction, {});
  expect(mockReply).toHaveBeenCalled();
});

