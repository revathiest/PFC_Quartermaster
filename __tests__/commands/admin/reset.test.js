const { execute } = require('../../../commands/admin/reset');
const { PermissionFlagsBits, MessageFlags } = require('discord.js');

jest.mock('process', () => ({
  exit: jest.fn()
}));

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
          fetch: jest.fn().mockResolvedValue(new Map([
            ['global1', { delete: jest.fn().mockResolvedValue(true) }]
          ])),
        },
      },
    },
    guild: {
      commands: {
        fetch: jest.fn().mockResolvedValue(new Map([
          ['guild1', { delete: jest.fn().mockResolvedValue(true) }]
        ])),
      },
    },
    reply: jest.fn(),
    editReply: jest.fn(),
  };
};

describe('/reset command', () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(code => {
        throw new Error(`process.exit called with "${code}"`);
      });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
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
    const interaction = mockInteraction(true);
    interaction.client.application.commands.fetch = jest.fn().mockResolvedValue(new Map([
      ['broken', { delete: jest.fn().mockRejectedValue(new Error('fail')) }],
    ]));
    await execute(interaction);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Error occurred during bot reset:'), expect.any(Error));
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: expect.stringContaining('❌ An error occurred'),
      flags: MessageFlags.Ephemeral,
    });
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('handles failure to edit reply after reset error', async () => {
    const interaction = mockInteraction(true);
    interaction.client.application.commands.fetch = jest.fn().mockRejectedValue(new Error('boom'));
    interaction.editReply = jest.fn().mockRejectedValue(new Error('edit fail'));

    await execute(interaction);

    expect(consoleErrorSpy).toHaveBeenCalledWith('❗ Failed to edit the interaction reply:', expect.any(Error));
    expect(process.exit).not.toHaveBeenCalled();
  });
});
