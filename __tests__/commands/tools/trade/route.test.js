const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/handlers/route', () => ({
  handleTradeRoute: jest.fn()
}));

const { handleTradeRoute } = require('../../../../utils/trade/handlers/route');
const command = require('../../../../commands/tools/trade/route');

describe('/trade route subcommand', () => {
  beforeEach(() => jest.clearAllMocks());

  test('delegates to handleTradeRoute', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', to: 'B' } });
    await command.execute(interaction, {});
    expect(handleTradeRoute).toHaveBeenCalledWith(interaction, {}, { from: 'A', to: 'B' });
  });

  test('defines command data with required options', () => {
    const data = command.data();
    const names = data.options.map(o => o.name);
    expect(names).toEqual(['from', 'to']);
    data.options.forEach(opt => expect(opt.required).toBe(true));
  });
});
