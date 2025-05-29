const { MockInteraction, MessageFlags } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeQueries', () => ({
  getBuyOptionsAtLocation: jest.fn(),
  getSellOptionsAtLocation: jest.fn(),
}));

jest.mock('../../../../utils/trade/resolveBestMatchingTerminal', () => ({
  resolveBestMatchingTerminal: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeCalculations', () => ({
  calculateProfitOptions: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeEmbeds', () => ({
  buildBestTradesEmbed: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeComponents', () => ({
  buildLocationSelectMenu: jest.fn(),
}));

jest.mock('../../../../utils/trade/handlers/shared', () => ({
  safeReply: jest.fn(),
  TradeStateCache: { set: jest.fn() }
}));

const { handleTradeRoute } = require('../../../../utils/trade/handlers/route');
const { getBuyOptionsAtLocation, getSellOptionsAtLocation } = require('../../../../utils/trade/tradeQueries');
const { resolveBestMatchingTerminal } = require('../../../../utils/trade/resolveBestMatchingTerminal');
const { calculateProfitOptions } = require('../../../../utils/trade/tradeCalculations');
const { buildBestTradesEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('handleTradeRoute', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sends route embed on success', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', to: 'B' } });
    getBuyOptionsAtLocation.mockResolvedValue([{ terminal: { name: 'A' }, commodity_name: 'X', price_buy: 10, scu_buy: 1 }]);
    getSellOptionsAtLocation.mockResolvedValue([{ terminal: { name: 'B' }, commodity_name: 'X', price_sell: 20 }]);
    resolveBestMatchingTerminal.mockReturnValueOnce({ name: 'A' }).mockReturnValueOnce({ name: 'B' });
    calculateProfitOptions.mockReturnValue([{ totalProfit: 10 }]);
    buildBestTradesEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeRoute(interaction, {}, { from: 'A', to: 'B' });

    expect(buildBestTradesEmbed).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('responds with error if terminals cannot be resolved', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', to: 'B' } });
    getBuyOptionsAtLocation.mockResolvedValue([]);
    getSellOptionsAtLocation.mockResolvedValue([]);
    resolveBestMatchingTerminal.mockReturnValue(null);

    await handleTradeRoute(interaction, {}, { from: 'A', to: 'B' });

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      content: expect.stringContaining('Could not confidently resolve'),
      flags: MessageFlags.Ephemeral,
    });
  });

  test('returns error when route not profitable', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', to: 'B' } });
    getBuyOptionsAtLocation.mockResolvedValue([{ terminal: { name: 'A' }, commodity_name: 'X', price_buy: 1, scu_buy: 1 }]);
    getSellOptionsAtLocation.mockResolvedValue([{ terminal: { name: 'B' }, commodity_name: 'X', price_sell: 0 }]);
    resolveBestMatchingTerminal.mockReturnValueOnce({ name: 'A' }).mockReturnValueOnce({ name: 'B' });
    calculateProfitOptions.mockReturnValue([]);

    await handleTradeRoute(interaction, {}, { from: 'A', to: 'B' });
    expect(safeReply).toHaveBeenCalledWith(interaction, { content: expect.stringContaining('No profitable trades'), flags: MessageFlags.Ephemeral });
  });
});
