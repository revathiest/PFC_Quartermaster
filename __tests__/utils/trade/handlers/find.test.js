const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeQueries', () => ({
  getSellOptionsAtLocation: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeCalculations', () => ({
  calculateProfitOptions: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeEmbeds', () => ({
  buildBestTradesEmbed: jest.fn(),
}));

jest.mock('../../../../utils/trade/handlers/shared', () => ({
  safeReply: jest.fn(),
}));

const { handleTradeFind } = require('../../../../utils/trade/handlers/find');
const { getSellOptionsAtLocation } = require('../../../../utils/trade/tradeQueries');
const { calculateProfitOptions } = require('../../../../utils/trade/tradeCalculations');
const { buildBestTradesEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('handleTradeFind', () => {
  let warnSpy;
  let errorSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('returns trades embed when results found', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', to: 'B' } });
    getSellOptionsAtLocation.mockResolvedValue([{ terminal: { name: 'B' }, price_buy: 10, scu_buy: 1 }]);
    calculateProfitOptions.mockReturnValue([{ totalProfit: 10 }]);
    buildBestTradesEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeFind(interaction);

    expect(buildBestTradesEmbed).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when no trades found', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', to: 'B' } });
    getSellOptionsAtLocation.mockResolvedValue([]);
    calculateProfitOptions.mockReturnValue([]);

    await handleTradeFind(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('No trades found'));
    expect(warnSpy).toHaveBeenCalled();
  });

  test('warns when no terminal matches to location', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', to: 'B' } });
    getSellOptionsAtLocation.mockResolvedValue([{ terminal: { name: 'C' }, price_buy: 10, scu_buy: 1 }]);
    calculateProfitOptions.mockReturnValue([]);

    await handleTradeFind(interaction);
    expect(warnSpy).toHaveBeenCalled();
  });

  test('handles query errors gracefully', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', to: 'B' } });
    getSellOptionsAtLocation.mockRejectedValue(new Error('fail'));
    await handleTradeFind(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('error'));
    expect(errorSpy).toHaveBeenCalled();
  });
});
