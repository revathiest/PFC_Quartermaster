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

const { handleTradeFind } = require('../../../../utils/trade/handlers/find');
const { getCommodityTradeOptions } = require('../../../../utils/trade/tradeQueries');
const { buildPriceEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('handleTradeFind', () => {
  let warnSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('returns price embed when results found', async () => {
    const interaction = new MockInteraction({ options: { commodity: 'Laranite', type: 'buy' } });
    getCommodityTradeOptions.mockResolvedValue([{ price_buy: 10, terminal: { name: 'Area18' } }]);
    buildPriceEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeFind(interaction);

    expect(buildPriceEmbed).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when no locations', async () => {
    const interaction = new MockInteraction({ options: { commodity: 'Laranite', type: 'buy' } });
    getCommodityTradeOptions.mockResolvedValue([]);

    await handleTradeFind(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('No buy locations'));
    expect(warnSpy).toHaveBeenCalled();
  });
});
