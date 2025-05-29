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

  test('sends locations embed', async () => {
    const interaction = new MockInteraction({});
    getTerminalsAtLocation.mockResolvedValue([{ name: 'T1' }]);
    buildLocationsEmbed.mockReturnValue({ title: 'embed' });

    await handleTradeLocations(interaction);

    expect(buildLocationsEmbed).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, { embeds: [{ title: 'embed' }] });
  });

  test('warns when no terminals', async () => {
    const interaction = new MockInteraction({});
    getTerminalsAtLocation.mockResolvedValue([]);

    await handleTradeLocations(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('No known terminals'));
    expect(warnSpy).toHaveBeenCalled();
  });

  test('handles lookup errors gracefully', async () => {
    const interaction = new MockInteraction({});
    getTerminalsAtLocation.mockRejectedValue(new Error('fail'));
    await handleTradeLocations(interaction);
    expect(safeReply).toHaveBeenCalledWith(interaction, expect.stringContaining('error'));
    expect(errorSpy).toHaveBeenCalled();
  });

  test('does not reply twice on error if already replied', async () => {
    const interaction = new MockInteraction({});
    interaction.replied = true;
    getTerminalsAtLocation.mockRejectedValue(new Error('boom'));
    await handleTradeLocations(interaction);
    expect(safeReply).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
