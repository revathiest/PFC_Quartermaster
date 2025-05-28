const { execute } = require('../../../commands/admin/lookupuser');
const { MessageFlags } = require('discord.js');

describe('/lookupuser command', () => {
  const createInteraction = (guildFetchFn, userFetchFn) => ({
    options: { getString: jest.fn(() => '123') },
    guild: { members: { fetch: guildFetchFn } },
    client: { users: { fetch: userFetchFn } },
    reply: jest.fn()
  });

  beforeEach(() => jest.clearAllMocks());

  test('replies with member info if found in guild', async () => {
    const interaction = createInteraction(
      jest.fn().mockResolvedValue({ displayName: 'Bob', user: { tag: 'Bob#1' } }),
      jest.fn()
    );
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('Bob'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('falls back to global user lookup', async () => {
    const interaction = createInteraction(
      jest.fn().mockRejectedValue(new Error('nope')),
      jest.fn().mockResolvedValue({ id: '123', tag: 'X#1' })
    );
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('X#1'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('handles failure of both lookups', async () => {
    const interaction = createInteraction(
      jest.fn().mockRejectedValue(new Error('nope')),
      jest.fn().mockRejectedValue(new Error('fail'))
    );
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining("Couldn't fetch"),
      flags: MessageFlags.Ephemeral
    });
  });
});
