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
});
