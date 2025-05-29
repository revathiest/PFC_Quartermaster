const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeHandlers', () => ({
  handleTradeFind: jest.fn()
}));

const { handleTradeFind } = require('../../../../utils/trade/tradeHandlers');
const command = require('../../../../commands/tools/trade/find');

describe('/trade find subcommand', () => {
  beforeEach(() => jest.clearAllMocks());

  test('delegates to handleTradeFind', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', to: 'B' } });
    await command.execute(interaction);
    expect(handleTradeFind).toHaveBeenCalledWith(interaction);
  });

  test('defines command data with from/to options', () => {
    const data = command.data();
    const names = data.options.map(o => o.name);
    expect(data.name).toBe('find');
    expect(names).toEqual(['from', 'to']);
    data.options.forEach(opt => expect(opt.required).toBe(true));
  });
});
