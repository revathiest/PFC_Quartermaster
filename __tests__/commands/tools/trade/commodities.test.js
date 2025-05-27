const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeHandlers', () => ({
  handleTradeCommodities: jest.fn()
}));

const { handleTradeCommodities } = require('../../../../utils/trade/tradeHandlers');
const command = require('../../../../commands/tools/trade/commodities');

describe('/trade commodities subcommand', () => {
  beforeEach(() => jest.clearAllMocks());

  test('delegates to handleTradeCommodities', async () => {
    const interaction = new MockInteraction({});
    await command.execute(interaction);
    expect(handleTradeCommodities).toHaveBeenCalledWith(interaction);
  });
});
