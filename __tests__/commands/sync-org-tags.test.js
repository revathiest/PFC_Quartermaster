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
  }));
  

const command = require('../../commands/sync-org-tags');
const { syncOrgTags } = require('../../botactions/orgTagSync/syncOrgTags');
const cooldownTracker = require('../../botactions/orgTagSync/syncCooldownTracker');

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
      ephemeral: true,
    });
    expect(syncOrgTags).not.toHaveBeenCalled();
    expect(cooldownTracker.markManualSyncRun).not.toHaveBeenCalled();
  });

  it('runs sync and responds if cooldown allows', async () => {
    cooldownTracker.canRunManualSync.mockReturnValue(true);

    await command.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: 'Running org tag sync now...',
      ephemeral: true,
    });
    expect(syncOrgTags).toHaveBeenCalledWith(mockInteraction.client);
    expect(cooldownTracker.markManualSyncRun).toHaveBeenCalled();
    expect(mockInteraction.followUp).toHaveBeenCalledWith({
      content: 'Org tag sync completed successfully.',
      ephemeral: true,
    });
  });
});
