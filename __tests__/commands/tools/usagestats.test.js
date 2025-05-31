jest.mock('../../../config/database', () => ({
  UsageLog: { findAll: jest.fn() },
  VoiceLog: { findAll: jest.fn() }
}));
jest.mock('../../../utils/verifyGuard', () => ({ isUserVerified: jest.fn() }));
jest.mock('../../../botactions/userManagement/permissions', () => ({ isAdmin: jest.fn() }));

const { MessageFlags, EmbedBuilder } = require('discord.js');
const db = require('../../../config/database');
const { isUserVerified } = require('../../../utils/verifyGuard');
const { isAdmin } = require('../../../botactions/userManagement/permissions');
const command = require('../../../commands/tools/usagestats');

describe('/usagestats command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeInteraction(targetId = 'req') {
    return {
      options: { getUser: jest.fn(() => ({ id: targetId, username: 't' })) },
      user: { id: 'req' },
      member: {},
      guildId: 'guild',
      guild: { members: { fetch: jest.fn(() => Promise.resolve({ displayName: 'Tester' })) } },
      deferReply: jest.fn(),
      reply: jest.fn(),
      editReply: jest.fn()
    };
  }

  test('blocks non-admin querying others', async () => {
    isUserVerified.mockResolvedValue(true);
    isAdmin.mockResolvedValue(false);
    const interaction = makeInteraction('other');

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('Only admins'), flags: MessageFlags.Ephemeral })
    );
  });

  test('rejects unverified user', async () => {
    isUserVerified.mockResolvedValue(false);
    const interaction = makeInteraction();

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('verify'), flags: MessageFlags.Ephemeral })
    );
  });

  test('builds usage summary embed', async () => {
    isUserVerified.mockResolvedValue(true);
    isAdmin.mockResolvedValue(true);
    db.UsageLog.findAll.mockResolvedValue([
      { interaction_type:'message', channel_id:'1', event_type:'message' },
      { interaction_type:'message', channel_id:'1', event_type:'message_edit' },
      { interaction_type:'message', channel_id:'1', event_type:'message_delete' },
      { interaction_type:'command', command_name:'ping' }
    ]);
    db.VoiceLog.findAll.mockResolvedValue([
      { channel_id:'1', duration:60 },
      { channel_id:'1', duration:30 }
    ]);
    const interaction = makeInteraction('other');

    await command.execute(interaction);

    const embed = interaction.editReply.mock.calls[0][0].embeds[0];
    expect(embed.data.title).toContain('Usage Summary');
    const field = embed.data.fields.find(f => f.name === '**Messages Sent/Edited/Deleted**');
    expect(field.value.trim()).toBe('1 /     1 /     1');
  });
});
