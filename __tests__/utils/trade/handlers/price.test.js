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
    expect(warnSpy).toHaveBeenCalled();
  });

  test('handles errors gracefully', async () => {
    const interaction = new MockInteraction({ options: { commodity: 'L', location: 'A' } });
    getCommodityTradeOptions.mockRejectedValue(new Error('fail'));
    await handleTradePrice(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('error'));
    expect(errorSpy).toHaveBeenCalled();
  });

  test('handles missing location filter', async () => {
    const interaction = new MockInteraction({ options: { commodity: 'L' } });
    getCommodityTradeOptions.mockResolvedValue([{ terminal: { name: 'A' } }]);
    buildPriceEmbed.mockReturnValue({ title: 'embed' });

    await handleTradePrice(interaction);
    expect(buildPriceEmbed).toHaveBeenCalledWith('L', undefined, [{ terminal: { name: 'A' } }]);
  });

  test('does not reply twice on error when already replied', async () => {
    const interaction = new MockInteraction({ options: { commodity: 'L' } });
    interaction.replied = true;
    getCommodityTradeOptions.mockRejectedValue(new Error('x'));
    await handleTradePrice(interaction);
    expect(safeReply).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
