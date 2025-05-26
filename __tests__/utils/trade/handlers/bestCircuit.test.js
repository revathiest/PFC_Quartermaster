const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeQueries', () => ({
  getSellOptionsAtLocation: jest.fn(),
  getVehicleByName: jest.fn(),
  getReturnOptions: jest.fn(),
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
const queries = require('../../../../utils/trade/tradeQueries');
const { calculateProfitOptions } = require('../../../../utils/trade/tradeCalculations');
const { buildCircuitEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('handleTradeBestCircuit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    console.warn.mockRestore();
  });

  test('replies with circuit embed when profits exist', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', with: 'Ship' } });
    interaction.options.getInteger = jest.fn(() => 100000);
    queries.getVehicleByName.mockResolvedValue({ scu: 1 });
    queries.getSellOptionsAtLocation.mockResolvedValue([{ terminal: 'A' }]);
    calculateProfitOptions.mockReturnValueOnce([{ terminal: 'B' }]);
    queries.getReturnOptions.mockResolvedValue([]);
    calculateProfitOptions.mockReturnValueOnce([]);
    buildCircuitEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeBestCircuit(interaction);

    expect(queries.getVehicleByName).toHaveBeenCalledWith('Ship');
    expect(queries.getSellOptionsAtLocation).toHaveBeenCalledWith('A');
    expect(buildCircuitEmbed).toHaveBeenCalledWith({ terminal: 'B' }, null, 'A');
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when no outbound profits', async () => {
    const interaction = new MockInteraction({ options: { from: 'A' } });
    interaction.options.getInteger = jest.fn(() => 100000);
    queries.getVehicleByName.mockResolvedValue({ scu: 1 });
    queries.getSellOptionsAtLocation.mockResolvedValue([]);
    calculateProfitOptions.mockReturnValue([]);

    await handleTradeBestCircuit(interaction);

    expect(safeReply).toHaveBeenCalledWith(
      interaction,
      expect.stringContaining('No outbound profitable trades')
    );
  });
});
