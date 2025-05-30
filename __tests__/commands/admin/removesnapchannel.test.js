const { execute } = require('../../../commands/admin/removesnapchannel');
const { removeSnapChannel } = require('../../../botactions/channelManagement/snapChannels');
const { MessageFlags } = require('discord.js');

jest.mock('../../../botactions/channelManagement/snapChannels', () => ({
  removeSnapChannel: jest.fn()
}));

const makeInteraction = (roles = []) => ({
  member: { roles: { cache: { map: fn => roles.map(r => fn({ name: r })) } } },
  options: { getChannel: jest.fn(() => ({ id: 'c1', name: 'chan' })) },
  guild: {},
  reply: jest.fn()
});

beforeEach(() => jest.clearAllMocks());

describe('/removesnapchannel command', () => {
  test('rejects users without role', async () => {
    const interaction = makeInteraction(['User']);
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('permission'),
      flags: MessageFlags.Ephemeral
    });
    expect(removeSnapChannel).not.toHaveBeenCalled();
  });

  test('removes channel when authorized', async () => {
    const interaction = makeInteraction(['Admiral']);
    await execute(interaction);
    expect(removeSnapChannel).toHaveBeenCalledWith('c1');
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('removed'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('handles errors gracefully', async () => {
    const interaction = makeInteraction(['Fleet Admiral']);
    const err = new Error('fail');
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    removeSnapChannel.mockRejectedValue(err);

    await execute(interaction);

    expect(spy).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('error'),
      flags: MessageFlags.Ephemeral
    });
    spy.mockRestore();
  });
});
