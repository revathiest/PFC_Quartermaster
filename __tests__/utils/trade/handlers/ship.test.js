const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeQueries', () => ({
  getVehicleByName: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeEmbeds', () => ({
  buildShipEmbed: jest.fn(),
}));

jest.mock('../../../../utils/trade/handlers/shared', () => ({
  safeReply: jest.fn(),
}));

const { handleTradeShip } = require('../../../../utils/trade/handlers/ship');
const { getVehicleByName } = require('../../../../utils/trade/tradeQueries');
const { buildShipEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('handleTradeShip', () => {
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

  test('sends ship embed', async () => {
    const interaction = new MockInteraction({ options: { name: 'Cutlass' } });
    getVehicleByName.mockResolvedValue({ name: 'Cutlass', scu: 46 });
    buildShipEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeShip(interaction);

    expect(buildShipEmbed).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when ship not found', async () => {
    const interaction = new MockInteraction({ options: { name: 'Ghost' } });
    getVehicleByName.mockResolvedValue(null);

    await handleTradeShip(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('not found'));
    expect(warnSpy).toHaveBeenCalled();
  });

  test('handles lookup errors gracefully', async () => {
    const interaction = new MockInteraction({ options: { name: 'Cutlass' } });
    getVehicleByName.mockRejectedValue(new Error('db'));
    await handleTradeShip(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('error'));
    expect(errorSpy).toHaveBeenCalled();
  });

  test('does not reply again if already replied on error', async () => {
    const interaction = new MockInteraction({ options: { name: 'Cutlass' } });
    interaction.replied = true;
    getVehicleByName.mockRejectedValue(new Error('x'));
    await handleTradeShip(interaction);
    expect(safeReply).not.toHaveBeenCalled();
  });
});
