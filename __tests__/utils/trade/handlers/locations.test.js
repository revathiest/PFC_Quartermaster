const { MockInteraction } = require('../../../../__mocks__/discord.js');

jest.mock('../../../../utils/trade/tradeQueries', () => ({
  getTerminalsAtLocation: jest.fn(),
}));

jest.mock('../../../../utils/trade/tradeEmbeds', () => ({
  buildLocationsEmbed: jest.fn(),
}));

jest.mock('../../../../utils/trade/handlers/shared', () => ({
  safeReply: jest.fn(),
}));

const { handleTradeLocations } = require('../../../../utils/trade/handlers/locations');
const { getTerminalsAtLocation } = require('../../../../utils/trade/tradeQueries');
const { buildLocationsEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('handleTradeLocations', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sends locations embed', async () => {
    const interaction = new MockInteraction({});
    getTerminalsAtLocation.mockResolvedValue([{ name: 'T1' }]);
    buildLocationsEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeLocations(interaction);

    expect(buildLocationsEmbed).toHaveBeenCalledWith([{ name: 'T1' }]);
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when no terminals', async () => {
    const interaction = new MockInteraction({});
    getTerminalsAtLocation.mockResolvedValue([]);

    await handleTradeLocations(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('No known terminals'));
  });
});
