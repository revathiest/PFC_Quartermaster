jest.mock('../../../config/database');
jest.mock('../../../utils/rsiProfileScraper');  // Mock BEFORE requiring the module under test

const { syncOrgTags } = require('../../../botactions/orgTagSync/syncOrgTags');
const { VerifiedUser, OrgTag } = require('../../../config/database');
const rsiProfileScraper = require('../../../utils/rsiProfileScraper'); // Import the full module, not destructured

describe('syncOrgTags', () => {
  let mockClient, mockGuild, mockMember;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMember = {
      displayName: 'WrongName',
      setNickname: jest.fn().mockResolvedValue(true),
      user: { id: 'user1', username: 'VerifiedUser', tag: 'VerifiedUser#1234' },
      manageable: true
    };

    mockGuild = {
      members: {
        fetch: jest.fn().mockResolvedValue(mockMember)
      }
    };

    mockClient = {
      guilds: {
        cache: {
          first: () => mockGuild
        }
      }
    };
  });

  it('updates rsiOrgId and corrects nickname if org changed', async () => {
    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'OLDORG', failedProfileChecks: 0 }
    ]);
  
    rsiProfileScraper.fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFC' });
  
    await syncOrgTags(mockClient);
  
    expect(VerifiedUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ rsiOrgId: 'PFCS', failedProfileChecks: 0 }),
      { where: { discordUserId: 'user1' } }
    );
    expect(mockMember.setNickname).toHaveBeenCalledWith('[PFC] WrongName');
  });

  it('does not update nickname if already correct', async () => {
    mockMember.displayName = '[PFC] WrongName';

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS', failedProfileChecks: 0 }
    ]);
  
    rsiProfileScraper.fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFC' });
  
    await syncOrgTags(mockClient);
  
    expect(VerifiedUser.update).toHaveBeenCalled();
    expect(mockMember.setNickname).not.toHaveBeenCalled();
  });

  it('skips nickname changes for users outside predefined orgs but updates DB', async () => {
    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS', failedProfileChecks: 0 }
    ]);
  
    rsiProfileScraper.fetchRsiProfileInfo.mockResolvedValue({ orgId: 'OUTLAW' });  // Not in predefined orgs
    OrgTag.findByPk.mockResolvedValue(null);  // No tag for OUTLAW
  
    await syncOrgTags(mockClient);
  
    expect(VerifiedUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ rsiOrgId: 'OUTLAW' }),
      { where: { discordUserId: 'user1' } }
    );
    expect(mockMember.setNickname).not.toHaveBeenCalled();
  });

  it('logs and skips if no guild found', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const clientWithNoGuild = { guilds: { cache: { first: () => undefined } } };

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS', failedProfileChecks: 0 }
    ]);

    await syncOrgTags(clientWithNoGuild);

    expect(consoleSpy).toHaveBeenCalledWith('🚫 No guild found. Skipping org tag sync.');
    consoleSpy.mockRestore();
  });

  it('handles missing member gracefully', async () => {
    mockGuild.members.fetch = jest.fn().mockRejectedValue(new Error('Member not found'));

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS', failedProfileChecks: 0 }
    ]);

    rsiProfileScraper.fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS' });

    await expect(syncOrgTags(mockClient)).resolves.not.toThrow();
    expect(VerifiedUser.update).toHaveBeenCalled();
  });

  it('continues processing if scraping fails for a user', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS', failedProfileChecks: 0 }
    ]);

    rsiProfileScraper.fetchRsiProfileInfo.mockRejectedValue(new Error('Scrape failed'));

    await syncOrgTags(mockClient);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to process VerifiedUser:'),
      expect.any(Error)
    );
    expect(VerifiedUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ failedProfileChecks: 1 }),
      { where: { discordUserId: 'user1' } }
    );
    consoleSpy.mockRestore();
  });

  // 🟢 New test for "profile not found → remove + unverify"
  it('removes user from DB after repeated profile not found errors', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS', failedProfileChecks: 2 }
    ]);

    rsiProfileScraper.fetchRsiProfileInfo.mockRejectedValue(new rsiProfileScraper.ProfileNotFoundError('not found'));

    await syncOrgTags(mockClient);

    expect(VerifiedUser.destroy).toHaveBeenCalledWith({
      where: { discordUserId: 'user1' }
    });
    expect(mockMember.setNickname).toHaveBeenCalledWith('WrongName ⛔');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
