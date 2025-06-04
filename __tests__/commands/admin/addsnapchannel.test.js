const { execute } = require('../../../commands/admin/addsnapchannel');
const { addSnapChannel } = require('../../../botactions/channelManagement/snapChannels');
const { MessageFlags } = require('discord.js');

jest.mock('../../../botactions/channelManagement/snapChannels', () => ({
  addSnapChannel: jest.fn()
}));

describe('/addsnapchannel command', () => {
  const makeInteraction = (hasPerm = false) => ({
    member: { permissions: { has: jest.fn(() => hasPerm) } },
    options: {
      getChannel: jest.fn(() => ({ id: 'c1', name: 'chan' })),
      getInteger: jest.fn(() => 7)
    },
    guild: { id: 'g1' },
    reply: jest.fn()
  });

  beforeEach(() => jest.clearAllMocks());

  test('rejects when user lacks role', async () => {
    const interaction = makeInteraction(false);
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('permission'),
      flags: MessageFlags.Ephemeral
    });
    expect(addSnapChannel).not.toHaveBeenCalled();
  });

  test('adds channel for authorized user', async () => {
    const interaction = makeInteraction(true);
    await execute(interaction);
    expect(addSnapChannel).toHaveBeenCalledWith('c1', 7, 'g1');
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('Snap channel chan added'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('uses default purge time when none provided', async () => {
    const interaction = makeInteraction(true);
    interaction.options.getInteger = jest.fn(() => null);
    await execute(interaction);
    expect(addSnapChannel).toHaveBeenCalledWith('c1', 30, 'g1');
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('Snap channel chan added'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('replies with error message on failure', async () => {
    const interaction = makeInteraction(true);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    addSnapChannel.mockRejectedValueOnce(new Error('oops'));
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('error'),
      flags: MessageFlags.Ephemeral
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
