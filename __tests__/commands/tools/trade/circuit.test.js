const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeHandlers', () => ({
  handleTradeBestCircuit: jest.fn()
}));

const { handleTradeBestCircuit } = require('../../../../utils/trade/tradeHandlers');
const command = require('../../../../commands/tools/trade/circuit');

describe('/trade circuit subcommand', () => {
  beforeEach(() => jest.clearAllMocks());

  test('delegates to handleTradeBestCircuit', async () => {
    const interaction = new MockInteraction({ options: { from: 'A' } });
    await command.execute(interaction);
    expect(handleTradeBestCircuit).toHaveBeenCalledWith(interaction);
  });

  test('defines command data with options', () => {
    const data = command.data();
    const optionNames = data.options.map(o => o.name);
    expect(data.name).toBe('circuit');
    expect(optionNames).toEqual(['from', 'with', 'cash']);
    const cashOpt = data.options.find(o => o.name === 'cash');
    expect(cashOpt.type).toBe('integer');
    expect(data.options.find(o => o.name === 'from').required).toBe(true);
  });
});
