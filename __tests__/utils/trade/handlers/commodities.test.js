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
  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
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
});
