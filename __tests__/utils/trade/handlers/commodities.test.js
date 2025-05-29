const { MockInteraction, ButtonBuilder } = require('../../../../__mocks__/discord.js');

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

  test('sends commodities embed', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    getSellOptionsAtLocation.mockResolvedValue([
      { commodity_name: 'A', price_buy: 1, price_sell: 2, terminal: { name: 'T1' } }
    ]);
    buildCommoditiesEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeCommodities(interaction);

    expect(buildCommoditiesEmbed).toHaveBeenCalledWith('Area18', expect.any(Array), 0, 1);
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }], components: expect.any(Array) });
  });

  test('warns when no commodities', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    getSellOptionsAtLocation.mockResolvedValue([]);

    await handleTradeCommodities(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('No commodity data'));
    expect(warnSpy).toHaveBeenCalled();
  });

  test('paginates long result with navigation buttons', async () => {
    const interaction = new MockInteraction({ options: { location: 'Lorville' } });
    const records = Array.from({ length: 20 }, (_, i) => ({
      commodity_name: `C${i}`,
      price_buy: i,
      price_sell: i + 1,
      terminal: { nickname: `T${i}` }
    }));
    getSellOptionsAtLocation.mockResolvedValue(records);
    buildCommoditiesEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeCommodities(interaction);

    expect(buildCommoditiesEmbed).toHaveBeenCalledWith('Lorville', expect.any(Array), 0, 20);

    const prev = ButtonBuilder.mock.instances[0];
    const next = ButtonBuilder.mock.instances[1];

    expect(prev.setCustomId).toHaveBeenCalledWith('trade_commodities_page::Lorville::-1');
    expect(next.setCustomId).toHaveBeenCalledWith('trade_commodities_page::Lorville::1');
    expect(prev.setDisabled).toHaveBeenCalledWith(true);
    expect(next.setDisabled).toHaveBeenCalledWith(false);
    const components = safeReply.mock.calls[0][1].components;
    expect(components).toHaveLength(1);
  });

  test('replies with generic error when query fails', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    getSellOptionsAtLocation.mockRejectedValue(new Error('fail'));

    await handleTradeCommodities(interaction);

    expect(errorSpy).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(
      interaction,
      expect.stringContaining('An error occurred')
    );
  });

  test('does not reply again if interaction already replied on error', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    interaction.replied = true;
    getSellOptionsAtLocation.mockRejectedValue(new Error('fail'));

    await handleTradeCommodities(interaction);

    expect(errorSpy).toHaveBeenCalled();
    expect(safeReply).not.toHaveBeenCalled();
  });

  test('handles duplicate and unknown terminals', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    const records = [
      { commodity_name: 'A', price_buy: 1, price_sell: 2, terminal: { nickname: 'T1' } },
      { commodity_name: 'B', price_buy: 3, price_sell: 4, terminal: { name: 'T1' } },
      { commodity_name: 'C', price_buy: 5, price_sell: 6, terminal: {} },
    ];
    getSellOptionsAtLocation.mockResolvedValue(records);
    buildCommoditiesEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeCommodities(interaction);

    const pageData = buildCommoditiesEmbed.mock.calls[0][1];
    expect(pageData[0].terminal).toBe('T1');
    expect(pageData.length).toBe(1);
    const components = safeReply.mock.calls[0][1].components;
    expect(components).toHaveLength(1);
  });

  test('returns empty page data when page out of range', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    getSellOptionsAtLocation.mockResolvedValue([
      { commodity_name: 'A', price_buy: 1, price_sell: 2, terminal: { name: 'T1' } },
    ]);
    buildCommoditiesEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeCommodities(interaction, { location: 'Area18', page: 5 });

    expect(buildCommoditiesEmbed).toHaveBeenCalledWith('Area18', [], 5, 1);
    const components = safeReply.mock.calls[0][1].components;
    expect(components).toHaveLength(0);
  });

  test('uses part numbering when terminal list is long', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    const records = Array.from({ length: 40 }, (_, i) => ({
      commodity_name: `C${i}`,
      price_buy: i,
      price_sell: i + 1,
      terminal: { nickname: 'T1' },
    }));
    getSellOptionsAtLocation.mockResolvedValue(records);
    buildCommoditiesEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeCommodities(interaction);

    const firstCallData = buildCommoditiesEmbed.mock.calls[0][1][0];
    expect(firstCallData.terminal).toBe('T1 (1/2)');
    const components = safeReply.mock.calls[0][1].components;
    expect(components).toHaveLength(1);
  });
});
