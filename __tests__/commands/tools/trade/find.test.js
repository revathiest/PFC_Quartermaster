const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeHandlers', () => ({
  handleTradeFind: jest.fn()
}));

const { handleTradeFind } = require('../../../../utils/trade/tradeHandlers');
const command = require('../../../../commands/tools/trade/find');

describe('/trade find subcommand', () => {
  beforeEach(() => jest.clearAllMocks());

  test('delegates to handleTradeFind', async () => {
    const interaction = new MockInteraction({ options: { commodity: 'Laranite', type: 'buy' } });
    await command.execute(interaction);
    expect(handleTradeFind).toHaveBeenCalledWith(interaction);
  });
});
