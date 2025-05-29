const { execute } = require('../../../commands/admin/addsnapchannel');
const { addSnapChannel } = require('../../../botactions/channelManagement/snapChannels');
const { MessageFlags } = require('discord.js');

jest.mock('../../../botactions/channelManagement/snapChannels', () => ({
  addSnapChannel: jest.fn()
}));

describe('/addsnapchannel command', () => {
  const makeInteraction = (roles = []) => ({
    member: { roles: { cache: { map: fn => roles.map(r => fn({ name: r })) } } },
    options: {
      getChannel: jest.fn(() => ({ id: 'c1', name: 'chan' })),
      getInteger: jest.fn(() => 7)
    },
    guild: { id: 'g1' },
    reply: jest.fn()
  });

  beforeEach(() => jest.clearAllMocks());

  test('rejects when user lacks role', async () => {
    const interaction = makeInteraction(['Member']);
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('permission'),
      flags: MessageFlags.Ephemeral
    });
    expect(addSnapChannel).not.toHaveBeenCalled();
  });

  test('adds channel for authorized user', async () => {
    const interaction = makeInteraction(['Admiral']);
    await execute(interaction);
    expect(addSnapChannel).toHaveBeenCalledWith('c1', 7, 'g1');
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('Snap channel chan added'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('uses default purge time when none provided', async () => {
    const interaction = makeInteraction(['Fleet Admiral']);
    interaction.options.getInteger = jest.fn(() => null);
    await execute(interaction);
    expect(addSnapChannel).toHaveBeenCalledWith('c1', 30, 'g1');
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('Snap channel chan added'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('replies with error message on failure', async () => {
    const interaction = makeInteraction(['Admiral']);
    addSnapChannel.mockRejectedValueOnce(new Error('oops'));
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('error'),
      flags: MessageFlags.Ephemeral
    });
  });
});
