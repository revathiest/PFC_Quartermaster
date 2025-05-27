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

  test('button interaction defers update and calls handler with page', async () => {
    const btn = {
      customId: 'trade_commodities_page::Area18::2',
      deferUpdate: jest.fn().mockResolvedValue(),
    };

    await command.button(btn);

    expect(btn.deferUpdate).toHaveBeenCalled();
    expect(handleTradeCommodities).toHaveBeenCalledWith(btn, { location: 'Area18', page: 2 });
  });
});
