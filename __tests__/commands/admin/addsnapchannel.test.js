const { execute } = require('../../../commands/admin/addsnapchannel');
const { addSnapChannel } = require('../../../botactions/channelManagement/snapChannels');
const { MessageFlags } = require('discord.js');

jest.mock('../../../botactions/channelManagement/snapChannels', () => ({
  addSnapChannel: jest.fn()
}));

describe('/addsnapchannel command', () => {
  const makeInteraction = () => ({
    member: { roles: { cache: { map: fn => [] } } },
    options: {
      getChannel: jest.fn(() => ({ id: 'c1', name: 'chan' })),
      getInteger: jest.fn(() => 7)
    },
    guild: { id: 'g1' },
    reply: jest.fn()
  });

  beforeEach(() => jest.clearAllMocks());


  test('adds channel for authorized user', async () => {
    const interaction = makeInteraction();
    await execute(interaction);
    expect(addSnapChannel).toHaveBeenCalledWith('c1', 7, 'g1');
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('Snap channel chan added'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('uses default purge time when none provided', async () => {
    const interaction = makeInteraction();
    interaction.options.getInteger = jest.fn(() => null);
    await execute(interaction);
    expect(addSnapChannel).toHaveBeenCalledWith('c1', 30, 'g1');
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('Snap channel chan added'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('replies with error message on failure', async () => {
    const interaction = makeInteraction();
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
