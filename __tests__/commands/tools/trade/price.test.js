const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeHandlers', () => ({
  handleTradePrice: jest.fn()
}));

const { handleTradePrice } = require('../../../../utils/trade/tradeHandlers');
const command = require('../../../../commands/tools/trade/price');

describe('/trade price subcommand', () => {
  beforeEach(() => jest.clearAllMocks());

  test('delegates to handleTradePrice', async () => {
    const interaction = new MockInteraction({ options: { commodity: 'A' } });
    await command.execute(interaction);
    expect(handleTradePrice).toHaveBeenCalledWith(interaction);
  });

  test('defines command data with commodity/location options', () => {
    const data = command.data();
    expect(data.name).toBe('price');
    const commodity = data.options.find(o => o.name === 'commodity');
    const location = data.options.find(o => o.name === 'location');
    expect(commodity.required).toBe(true);
    expect(location.required).toBe(false);
  });
});
