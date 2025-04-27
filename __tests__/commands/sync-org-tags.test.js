jest.mock('../../botactions/orgTagSync/syncOrgTags');
jest.mock('../../botactions/orgTagSync/syncCooldownTracker');

jest.mock('discord.js', () => ({
  SlashCommandBuilder: jest.fn(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setDefaultMemberPermissions: jest.fn().mockReturnThis(),
  })),
  PermissionFlagsBits: {
    Administrator: 0x00000008,
  },
  MessageFlags: {
    Ephemeral: 1 << 6, // 64 (Discord's Ephemeral flag)
  },
}));

const command = require('../../commands/sync-org-tags');
const { syncOrgTags } = require('../../botactions/orgTagSync/syncOrgTags');
const cooldownTracker = require('../../botactions/orgTagSync/syncCooldownTracker');
const { MessageFlags } = require('discord.js'); // ✅ Pull it in to use below

describe('/sync-org-tags command', () => {
  let mockInteraction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInteraction = {
      client: { some: 'client' },
      reply: jest.fn().mockResolvedValue(true),
      followUp: jest.fn().mockResolvedValue(true),
    };
  });

  it('blocks sync if cooldown active', async () => {
    cooldownTracker.canRunManualSync.mockReturnValue(false);

    await command.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: 'Sync was run recently. Please wait before running again.',
      flags: MessageFlags.Ephemeral, // ✅ Updated here!
    });
    expect(syncOrgTags).not.toHaveBeenCalled();
    expect(cooldownTracker.markManualSyncRun).not.toHaveBeenCalled();
  });

  it('runs sync and responds if cooldown allows', async () => {
    cooldownTracker.canRunManualSync.mockReturnValue(true);

    await command.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: 'Running org tag sync now...',
      flags: MessageFlags.Ephemeral, // ✅ Updated here!
    });
    expect(syncOrgTags).toHaveBeenCalledWith(mockInteraction.client);
    expect(cooldownTracker.markManualSyncRun).toHaveBeenCalled();
    expect(mockInteraction.followUp).toHaveBeenCalledWith({
      content: 'Org tag sync completed successfully.',
      flags: MessageFlags.Ephemeral, // ✅ Updated here!
    });
  });
});
