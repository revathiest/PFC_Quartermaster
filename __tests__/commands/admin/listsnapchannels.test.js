const { execute } = require('../../../commands/admin/listsnapchannels');
const { listSnapChannels } = require('../../../botactions/channelManagement/snapChannels');
const { MessageFlags } = require('discord.js');

jest.mock('../../../botactions/channelManagement/snapChannels', () => ({
  listSnapChannels: jest.fn()
}));

const makeInteraction = (roles = []) => {
  const guild = {
    id: 'guild1',
    name: 'Test Guild',
    channels: { cache: new Map([['c1', { name: 'chan1' }]]) }
  };
  return {
    member: { roles: { cache: { map: fn => roles.map(r => fn({ name: r })) } } },
    guild,
    reply: jest.fn()
  };
};

beforeEach(() => jest.clearAllMocks());

describe('/listsnapchannels command', () => {
  test('rejects users without required role', async () => {
    const interaction = makeInteraction(['User']);
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('permission'),
      flags: MessageFlags.Ephemeral
    });
    expect(listSnapChannels).not.toHaveBeenCalled();
  });

  test('lists channels for authorized user', async () => {
    const interaction = makeInteraction(['Admiral']);
    listSnapChannels.mockResolvedValue([{ channelId: 'c1', purgeTimeInDays: 3 }]);
    await execute(interaction);
    expect(listSnapChannels).toHaveBeenCalledWith({ where: { serverId: 'guild1' } });
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('chan1'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('falls back to channelId when channel not found', async () => {
    const interaction = makeInteraction(['Admiral']);
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
    const interaction = makeInteraction(['Fleet Admiral']);
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
