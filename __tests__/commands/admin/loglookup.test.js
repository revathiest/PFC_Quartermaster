jest.mock('../../../config/database', () => ({ UsageLog: { findAll: jest.fn() } }));

const { MessageFlags } = require('discord.js');
const { UsageLog } = require('../../../config/database');
const command = require('../../../commands/admin/loglookup');

function makeInteraction(opts = {}) {
  return {
    guild: { id: 'guild' },
    options: {
      getString: jest.fn(name => opts[name]),
      getUser: jest.fn(name => opts[name]),
    },
    reply: jest.fn(),
  };
}

beforeEach(() => { jest.clearAllMocks(); });

describe('/loglookup command', () => {
  test('queries with provided filters', async () => {
    UsageLog.findAll.mockResolvedValue([]);
    const interaction = makeInteraction({ user: { id: 'u1' }, event: 'message_delete' });

    await command.execute(interaction);

    expect(UsageLog.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        server_id: 'guild',
        user_id: 'u1',
        event_type: 'message_delete',
      }),
      order: [['timestamp', 'DESC']],
      limit: 20,
    }));
    expect(interaction.reply).toHaveBeenCalledWith({ content: 'No matching logs found.', flags: MessageFlags.Ephemeral });
  });

  test('formats embed with log entries', async () => {
    const log = { user_id: 'u1', event_type: 'message_create', channel_id: 'c1', message_content: 'hi', message_id: '123', timestamp: '2023-01-01T00:00:00.000Z' };
    UsageLog.findAll.mockResolvedValue([log]);
    const interaction = makeInteraction();

    await command.execute(interaction);

    const embed = interaction.reply.mock.calls[0][0].embeds[0];
    expect(embed.data.title).toBe('Usage Log Results');
    expect(embed.data.fields[0].name).toContain('message_create');
    expect(embed.data.fields[0].value).toContain('hi');
  });

  test('handles query errors', async () => {
    UsageLog.findAll.mockRejectedValue(new Error('fail'));
    const interaction = makeInteraction();

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('error'), flags: MessageFlags.Ephemeral }));
  });
});
