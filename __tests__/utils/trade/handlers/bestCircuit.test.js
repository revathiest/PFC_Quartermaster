const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeQueries', () => ({
  getSellOptionsAtLocation: jest.fn(),
  getReturnOptions: jest.fn(),
  getVehicleByName: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeCalculations', () => ({
  calculateProfitOptions: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeEmbeds', () => ({
  buildCircuitEmbed: jest.fn(),
}));

jest.mock('../../../../utils/trade/handlers/shared', () => ({
  safeReply: jest.fn(),
}));

const { handleTradeBestCircuit } = require('../../../../utils/trade/handlers/bestCircuit');
const tradeQueries = require('../../../../utils/trade/tradeQueries');
const { calculateProfitOptions } = require('../../../../utils/trade/tradeCalculations');
const { buildCircuitEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('handleTradeBestCircuit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('replies with circuit embed on success', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', with: 'ship' } });
    interaction.options.getInteger = jest.fn().mockReturnValue(1000);
    tradeQueries.getVehicleByName.mockResolvedValue({ scu: 66 });
    tradeQueries.getSellOptionsAtLocation.mockResolvedValue([{ terminal: 'B' }]);
    tradeQueries.getReturnOptions.mockResolvedValue([]);
    calculateProfitOptions
      .mockReturnValueOnce([{ terminal: 'B', totalProfit: 10 }])
      .mockReturnValueOnce([]);
    buildCircuitEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeBestCircuit(interaction);

    expect(buildCircuitEmbed).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when no outbound profits', async () => {
    const interaction = new MockInteraction({ options: { from: 'A' } });
    interaction.options.getInteger = jest.fn().mockReturnValue(100000);
    tradeQueries.getSellOptionsAtLocation.mockResolvedValue([]);
    calculateProfitOptions.mockReturnValueOnce([]);

    await handleTradeBestCircuit(interaction);

    expect(safeReply).toHaveBeenCalledWith(
      interaction,
      expect.stringContaining('No outbound profitable trades')
    );
  });
});
