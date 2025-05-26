const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeQueries', () => ({
  getCommodityTradeOptions: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeEmbeds', () => ({
  buildPriceEmbed: jest.fn(),
}));

jest.mock('../../../../utils/trade/handlers/shared', () => ({
  safeReply: jest.fn(),
}));

const { handleTradePrice } = require('../../../../utils/trade/handlers/price');
const { getCommodityTradeOptions } = require('../../../../utils/trade/tradeQueries');
const { buildPriceEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('handleTradePrice', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sends price embed', async () => {
    const interaction = new MockInteraction({ options: { commodity: 'Laranite', location: 'Area18' } });
    getCommodityTradeOptions.mockResolvedValue([{ terminal: { name: 'Area18' } }]);
    buildPriceEmbed.mockReturnValue({ title: 'embed' });

    await handleTradePrice(interaction);

    expect(buildPriceEmbed).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when no prices', async () => {
    const interaction = new MockInteraction({ options: { commodity: 'Laranite', location: 'Area18' } });
    getCommodityTradeOptions.mockResolvedValue([]);

    await handleTradePrice(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('No price data'));
  });
});
