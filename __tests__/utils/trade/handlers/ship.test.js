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
  beforeEach(() => jest.clearAllMocks());

  test('sends ship embed', async () => {
    const interaction = new MockInteraction({ options: { name: 'Cutlass' } });
    getVehicleByName.mockResolvedValue({ name: 'Cutlass', scu: 46 });
    buildShipEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeShip(interaction);

    expect(getVehicleByName).toHaveBeenCalledWith('Cutlass');
    expect(buildShipEmbed).toHaveBeenCalledWith({ name: 'Cutlass', scu: 46 });
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when ship not found', async () => {
    const interaction = new MockInteraction({ options: { name: 'Ghost' } });
    getVehicleByName.mockResolvedValue(null);

    await handleTradeShip(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('not found'));
  });
});
