const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeQueries', () => ({
  getCommodityPricesAtLocation: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeEmbeds', () => ({
  buildCommodityPricesEmbed: jest.fn(),
}));

jest.mock('../../../../utils/trade/handlers/shared', () => ({
  safeReply: jest.fn(),
}));

const { handleTradeCommodities } = require('../../../../utils/trade/handlers/commodities');
const { getCommodityPricesAtLocation } = require('../../../../utils/trade/tradeQueries');
const { buildCommodityPricesEmbed } = require('../../../../utils/trade/tradeEmbeds');
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
    getCommodityPricesAtLocation.mockResolvedValue([{ commodity_name: 'A' }]);
    buildCommodityPricesEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeCommodities(interaction);

    expect(buildCommodityPricesEmbed).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when no commodities', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    getCommodityPricesAtLocation.mockResolvedValue([]);
    await handleTradeCommodities(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('commodity data')); 
    expect(warnSpy).toHaveBeenCalled();
  });
});
