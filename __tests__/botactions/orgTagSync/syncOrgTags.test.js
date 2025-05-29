jest.mock('../../../config/database', () => require('../../../__mocks__/config/database'));
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
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'OLDORG' }
    ]);
  
    rsiProfileScraper.fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFC' });
  
    await syncOrgTags(mockClient);
  
    expect(VerifiedUser.update).toHaveBeenCalledWith(
      { rsiOrgId: 'PFCS' },
      { where: { discordUserId: 'user1' } }
    );
    expect(mockMember.setNickname).toHaveBeenCalledWith('[PFC] WrongName');
  });

  it('does not update nickname if already correct', async () => {
    mockMember.displayName = '[PFC] WrongName';
  
    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS' }
    ]);
  
    rsiProfileScraper.fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFC' });
  
    await syncOrgTags(mockClient);
  
    expect(VerifiedUser.update).not.toHaveBeenCalled();
    expect(mockMember.setNickname).not.toHaveBeenCalled();
  });

  it('skips nickname changes for users outside predefined orgs but updates DB', async () => {
    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS' }
    ]);
  
    rsiProfileScraper.fetchRsiProfileInfo.mockResolvedValue({ orgId: 'OUTLAW' });  // Not in predefined orgs
    OrgTag.findByPk.mockResolvedValue(null);  // No tag for OUTLAW
  
    await syncOrgTags(mockClient);
  
    expect(VerifiedUser.update).toHaveBeenCalledWith(
      { rsiOrgId: 'OUTLAW' },
      { where: { discordUserId: 'user1' } }
    );
    expect(mockMember.setNickname).not.toHaveBeenCalled();
  });

  it('logs and skips if no guild found', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const clientWithNoGuild = { guilds: { cache: { first: () => undefined } } };

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS' }
    ]);

    await syncOrgTags(clientWithNoGuild);

    expect(consoleSpy).toHaveBeenCalledWith('⚠️ No guild found. Skipping org tag sync.');
    consoleSpy.mockRestore();
  });

  it('handles missing member gracefully', async () => {
    mockGuild.members.fetch = jest.fn().mockRejectedValue(new Error('Member not found'));

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS' }
    ]);

    rsiProfileScraper.fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS' });

    await expect(syncOrgTags(mockClient)).resolves.not.toThrow();
    expect(VerifiedUser.update).not.toHaveBeenCalled(); 
  });

  it('continues processing if scraping fails for a user', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS' }
    ]);

    rsiProfileScraper.fetchRsiProfileInfo.mockRejectedValue(new Error('Scrape failed'));  

    await syncOrgTags(mockClient);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to process VerifiedUser:'),
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  // 🟢 New test for "profile not found → remove + unverify"
  it('removes user from DB and updates nickname if RSI profile not found', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS' }
    ]);

    const err = new Error('Profile not found');
    err.code = 'PROFILE_NOT_FOUND';
    rsiProfileScraper.fetchRsiProfileInfo.mockRejectedValue(err);

    await syncOrgTags(mockClient);

    expect(VerifiedUser.destroy).toHaveBeenCalledWith({
      where: { discordUserId: 'user1' }
    });
    expect(mockMember.setNickname).toHaveBeenCalledWith('WrongName ⛔');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('RSI profile not found for VerifiedUser')
    );
    consoleSpy.mockRestore();
  });

  it('warns and skips if member is not manageable', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockMember.manageable = false;

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'OLDORG' }
    ]);

    rsiProfileScraper.fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFC' });

    await syncOrgTags(mockClient);

    expect(warnSpy).toHaveBeenCalledWith(
      '⚠️ Skipping VerifiedUser#1234: Cannot manage this member.'
    );
    expect(mockMember.setNickname).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('skips nickname update for unmanageable member when profile not found', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockMember.manageable = false;

    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiHandle: 'VerifiedUser', rsiOrgId: 'PFCS' }
    ]);

    const err = new Error('Profile gone');
    err.code = 'PROFILE_NOT_FOUND';
    rsiProfileScraper.fetchRsiProfileInfo.mockRejectedValue(err);

    await syncOrgTags(mockClient);

    expect(VerifiedUser.destroy).toHaveBeenCalledWith({
      where: { discordUserId: 'user1' }
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '⚠️ Skipping nickname update for VerifiedUser#1234: Cannot manage this member.'
    );
    expect(mockMember.setNickname).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
