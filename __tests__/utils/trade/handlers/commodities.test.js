const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeQueries', () => ({
  getSellOptionsAtLocation: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeEmbeds', () => ({
  buildCommoditiesEmbed: jest.fn(),
}));

jest.mock('../../../../utils/trade/handlers/shared', () => ({
  safeReply: jest.fn(),
}));

const { handleTradeCommodities } = require('../../../../utils/trade/handlers/commodities');
const { getSellOptionsAtLocation } = require('../../../../utils/trade/tradeQueries');
const { buildCommoditiesEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('handleTradeCommodities', () => {
  let warnSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('sends commodities embed', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    getSellOptionsAtLocation.mockResolvedValue([{ commodity_name: 'A', price_buy: 1, price_sell: 2 }]);
    buildCommoditiesEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeCommodities(interaction);

    expect(buildCommoditiesEmbed).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when no commodities', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    getSellOptionsAtLocation.mockResolvedValue([]);

    await handleTradeCommodities(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('No commodity data'));
    expect(warnSpy).toHaveBeenCalled();
  });
});
