const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeHandlers', () => ({
  handleTradeCommodities: jest.fn()
}));

const { handleTradeCommodities } = require('../../../../utils/trade/tradeHandlers');
const command = require('../../../../commands/tools/trade/commodities');

describe('/trade commodities subcommand', () => {
  beforeEach(() => jest.clearAllMocks());

  test('delegates to handleTradeCommodities', async () => {
    const interaction = new MockInteraction({ options: { location: 'Area18' } });
    await command.execute(interaction);
    expect(handleTradeCommodities).toHaveBeenCalledWith(interaction);
  });

  test('defines command data with location option', () => {
    const data = command.data();
    expect(data.name).toBe('commodities');
    expect(data.options).toHaveLength(1);
    expect(data.options[0]).toEqual(expect.objectContaining({ name: 'location', required: true }));
  });

  test('button interaction defers update and calls handler with page', async () => {
    const btn = {
      customId: 'trade_commodities_page::Area18::2',
      deferUpdate: jest.fn().mockResolvedValue(),
    };

    await command.button(btn);

    expect(btn.deferUpdate).toHaveBeenCalled();
    expect(handleTradeCommodities).toHaveBeenCalledWith(btn, { location: 'Area18', page: 2 });
  });

  test('ignores unrelated button customId', async () => {
    const btn = { customId: 'other', deferUpdate: jest.fn() };
    await command.button(btn);
    expect(btn.deferUpdate).not.toHaveBeenCalled();
    expect(handleTradeCommodities).not.toHaveBeenCalled();
  });
});
