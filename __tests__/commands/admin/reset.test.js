const { execute } = require('../../../commands/admin/reset');
const { PermissionFlagsBits, MessageFlags } = require('discord.js');

jest.spyOn(process, 'exit').mockImplementation(() => {}); // Single global spy

const mockInteraction = (isAdmin = true) => {
  const user = { tag: 'TestUser#0001' };

  return {
    member: {
      user,
      permissions: {
        has: jest.fn().mockReturnValue(isAdmin),
      },
    },
    user,
    client: {
      application: {
        commands: {
          set: jest.fn().mockResolvedValue(), // global .set()
        },
      },
    },
    guild: {
      commands: {
        set: jest.fn().mockResolvedValue(), // guild .set()
      },
    },
    reply: jest.fn().mockResolvedValue(),
    editReply: jest.fn().mockResolvedValue(),
  };
};

describe('/reset command', () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('allows admin to trigger reset and shuts down', async () => {
    const interaction = mockInteraction(true);

    await execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({ content: 'Resetting...', flags: MessageFlags.Ephemeral });
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('blocks non-admin users', async () => {
    const interaction = mockInteraction(false);

    await execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('Only an administrator'),
      flags: MessageFlags.Ephemeral,
    });
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('handles command deletion failure gracefully', async () => {
    const interaction = mockInteraction();
    interaction.client.application.commands.set.mockRejectedValue(new Error('Global set failed'));
    interaction.guild.commands.set.mockRejectedValue(new Error('Guild set failed'));

    await execute(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: '❌ An error occurred while resetting the commands.',
      flags: MessageFlags.Ephemeral,
    });
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('handles failure to edit reply after reset error', async () => {
    const interaction = mockInteraction();
    interaction.client.application.commands.set.mockRejectedValue(new Error('Global set failed'));
    interaction.guild.commands.set.mockRejectedValue(new Error('Guild set failed'));
    interaction.editReply.mockRejectedValue(new Error('edit fail'));

    await execute(interaction);

    expect(consoleErrorSpy).toHaveBeenCalledWith('❗ Failed to edit the interaction reply:', expect.any(Error));
    expect(process.exit).not.toHaveBeenCalled();
  });
});
