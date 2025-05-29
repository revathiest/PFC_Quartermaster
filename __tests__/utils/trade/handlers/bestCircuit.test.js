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
const {
  getSellOptionsAtLocation,
  getVehicleByName,
  getReturnOptions,
} = require('../../../../utils/trade/tradeQueries');
const { calculateProfitOptions } = require('../../../../utils/trade/tradeCalculations');
const { buildCircuitEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('handleTradeBestCircuit', () => {
  let warnSpy;
  let errorSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('builds circuit embed with outbound and return trades', async () => {
    const interaction = new MockInteraction({ options: { from: 'Area18', with: 'Cutlass' } });
    interaction.options.getInteger = jest.fn(() => 123);
    getVehicleByName.mockResolvedValue({ name: 'Cutlass', scu: 42 });
    getSellOptionsAtLocation.mockResolvedValue([{ price_buy: 1 }]);
    const outbound = { terminal: 'T1', profitPerSCU: 10 };
    const returning = { terminal: 'T2', profitPerSCU: 5 };
    calculateProfitOptions.mockReturnValueOnce([outbound]).mockReturnValueOnce([returning]);
    getReturnOptions.mockResolvedValue([{ dummy: true }]);
    buildCircuitEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeBestCircuit(interaction);

    expect(getVehicleByName).toHaveBeenCalledWith('Cutlass');
    expect(getSellOptionsAtLocation).toHaveBeenCalledWith('Area18');
    expect(calculateProfitOptions).toHaveBeenNthCalledWith(1, [{ price_buy: 1 }], 42, 123);
    expect(calculateProfitOptions).toHaveBeenNthCalledWith(2, [{ dummy: true }], 42, 123);
    expect(buildCircuitEmbed).toHaveBeenCalledWith(outbound, returning, 'Area18');
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('uses default ship and handles missing return profits', async () => {
    const interaction = new MockInteraction({ options: { from: 'MicroTech' } });
    interaction.options.getInteger = jest.fn(() => undefined);
    getSellOptionsAtLocation.mockResolvedValue([{ x: 1 }]);
    calculateProfitOptions.mockReturnValueOnce([{ terminal: 'T1' }]).mockReturnValueOnce([]);
    getReturnOptions.mockResolvedValue([{ test: true }]);
    buildCircuitEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeBestCircuit(interaction);

    expect(getVehicleByName).not.toHaveBeenCalled();
    expect(calculateProfitOptions).toHaveBeenNthCalledWith(1, [{ x: 1 }], 66, 100000);
    expect(calculateProfitOptions).toHaveBeenNthCalledWith(2, [{ test: true }], 66, 100000);
    expect(buildCircuitEmbed).toHaveBeenCalledWith({ terminal: 'T1' }, null, 'MicroTech');
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when no outbound profits found', async () => {
    const interaction = new MockInteraction({ options: { from: 'Orison', with: 'Ship' } });
    interaction.options.getInteger = jest.fn(() => undefined);
    getVehicleByName.mockResolvedValue({ scu: 20 });
    getSellOptionsAtLocation.mockResolvedValue([]);
    calculateProfitOptions.mockReturnValueOnce([]);

    await handleTradeBestCircuit(interaction);

    expect(safeReply).toHaveBeenCalledWith(interaction, '❌ No outbound profitable trades from **Orison**.');
    expect(warnSpy).toHaveBeenCalled();
    expect(getReturnOptions).not.toHaveBeenCalled();
  });

  test('reports generic error when exception occurs', async () => {
    const interaction = new MockInteraction({ options: { from: 'A', with: 'B' } });
    interaction.options.getInteger = jest.fn(() => undefined);
    getVehicleByName.mockRejectedValue(new Error('boom'));

    await handleTradeBestCircuit(interaction);

    expect(errorSpy).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, '⚠️ An error occurred processing your request.');
  });
});
