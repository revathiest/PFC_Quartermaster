const { execute } = require('../../../commands/admin/listsnapchannels');
const { listSnapChannels } = require('../../../botactions/channelManagement/snapChannels');
const { MessageFlags } = require('discord.js');

jest.mock('../../../botactions/channelManagement/snapChannels', () => ({
  listSnapChannels: jest.fn()
}));

const makeInteraction = () => {
  const guild = {
    id: 'guild1',
    name: 'Test Guild',
    channels: { cache: new Map([['c1', { name: 'chan1' }]]) }
  };
  return {
    member: { roles: { cache: { map: fn => [] } } },
    guild,
    reply: jest.fn()
  };
};

beforeEach(() => jest.clearAllMocks());

describe('/listsnapchannels command', () => {

  test('lists channels for authorized user', async () => {
    const interaction = makeInteraction();
    listSnapChannels.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 3 }]);
    await execute(interaction);
    expect(listSnapChannels).toHaveBeenCalledWith({ where: { serverId: 'guild1' } });
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('chan1'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('falls back to channelId when channel not found', async () => {
    const interaction = makeInteraction();
    // Remove the known channel to force fallback path
    interaction.guild.channels.cache = new Map();
    listSnapChannels.mockResolvedValue([{ channelId: 'c2', purgeTimeInDays: 4 }]);

    await execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('c2'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('handles errors gracefully', async () => {
    const interaction = makeInteraction();
    const err = new Error('fail');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    listSnapChannels.mockRejectedValue(err);

    await execute(interaction);

    expect(errorSpy).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('error'),
      flags: MessageFlags.Ephemeral
    });
    errorSpy.mockRestore();
  });
});
