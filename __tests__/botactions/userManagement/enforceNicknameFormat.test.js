const { enforceNicknameFormat } = require('../../../botactions/userManagement/enforceNicknameFormat');
const { VerifiedUser, OrgTag } = require('../../../config/database');
const { formatVerifiedNickname } = require('../../../utils/formatVerifiedNickname');
const { pendingVerifications } = require('../../../commands/user/verify');

jest.mock('../../../config/database');
jest.mock('../../../utils/formatVerifiedNickname');
jest.mock('../../../commands/user/verify', () => ({
  pendingVerifications: new Set(),
}));

describe('enforceNicknameFormat', () => {
  let mockOldMember, mockNewMember;

  const createMockMember = (id, username, nickname = null, isBot = false) => ({
    id,
    nickname,
    displayName: nickname || username,
    user: { id, username, tag: `${username}#1234`, bot: isBot },
    setNickname: jest.fn().mockResolvedValue(true),
  });

  OrgTag.findAll.mockResolvedValue([
    { tag: 'PFCS' }, 
    { tag: 'DEFN' }, 
    { tag: 'PFC' }
  ]);
  
  beforeEach(() => {
    jest.clearAllMocks();
    pendingVerifications.clear();
  });

  it('skips enforcement for bots', async () => {
    mockOldMember = createMockMember('user1', 'TestUser', 'OldNick', true);
    mockNewMember = { ...mockOldMember, nickname: 'NewNick' };

    await enforceNicknameFormat(mockOldMember, mockNewMember);
    expect(VerifiedUser.findByPk).not.toHaveBeenCalled();
  });

  it('skips if nickname did not change', async () => {
    mockOldMember = createMockMember('user1', 'TestUser', 'SameNick');
    mockNewMember = createMockMember('user1', 'TestUser', 'SameNick');

    await enforceNicknameFormat(mockOldMember, mockNewMember);
    expect(VerifiedUser.findByPk).not.toHaveBeenCalled();
  });

  it('skips if user is in pending verifications', async () => {
    pendingVerifications.add('user1');
    mockOldMember = createMockMember('user1', 'TestUser', 'OldNick');
    mockNewMember = createMockMember('user1', 'TestUser', 'NewNick');

    await enforceNicknameFormat(mockOldMember, mockNewMember);
    expect(VerifiedUser.findByPk).not.toHaveBeenCalled();
  });

  it('updates nickname for unverified user needing ⛔', async () => {
    VerifiedUser.findByPk.mockResolvedValue(null); // Unverified
    formatVerifiedNickname.mockReturnValue('UnverifiedUser ⛔');

    mockOldMember = createMockMember('user1', 'UnverifiedUser', 'OldNick');
    mockNewMember = createMockMember('user1', 'UnverifiedUser', 'WrongNick');

    await enforceNicknameFormat(mockOldMember, mockNewMember);

    expect(mockNewMember.setNickname).toHaveBeenCalledWith('UnverifiedUser ⛔');
  });

  it('does not update if nickname already matches for unverified user', async () => {
    VerifiedUser.findByPk.mockResolvedValue(null);
    formatVerifiedNickname.mockReturnValue('UnverifiedUser ⛔');

    mockOldMember = createMockMember('user1', 'UnverifiedUser', 'OldNick');
    mockNewMember = createMockMember('user1', 'UnverifiedUser', 'UnverifiedUser ⛔');

    await enforceNicknameFormat(mockOldMember, mockNewMember);

    expect(mockNewMember.setNickname).not.toHaveBeenCalled();
  });

  it('updates nickname correctly for verified user with known org tag', async () => {
    VerifiedUser.findByPk.mockResolvedValue({ discordUserId: 'user1', rsiOrgId: 'PFCS' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFCS' });
    formatVerifiedNickname.mockReturnValue('[PFCS] VerifiedUser');

    mockOldMember = createMockMember('user1', 'VerifiedUser', 'OldNick');
    mockNewMember = createMockMember('user1', 'VerifiedUser', 'WrongNick');

    await enforceNicknameFormat(mockOldMember, mockNewMember);

    expect(mockNewMember.setNickname).toHaveBeenCalledWith('[PFCS] VerifiedUser');
  });

  it('handles errors gracefully without throwing', async () => {
    VerifiedUser.findByPk.mockResolvedValue({ discordUserId: 'user1', rsiOrgId: 'PFCS' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFCS' });
    formatVerifiedNickname.mockReturnValue('[PFCS] VerifiedUser');

    mockOldMember = createMockMember('user1', 'VerifiedUser', 'OldNick');
    mockNewMember = createMockMember('user1', 'VerifiedUser', 'WrongNick');
    mockNewMember.setNickname.mockRejectedValue(new Error('Test error'));

    const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await enforceNicknameFormat(mockOldMember, mockNewMember);
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '⚠️ Failed to update VerifiedUser#1234:',
      'Test error'
    );

    mockConsoleWarn.mockRestore();
  });

  it('preserves unknown tag for verified user with no matching org tag', async () => {
    VerifiedUser.findByPk.mockResolvedValue({ discordUserId: 'user1', rsiOrgId: null });
    // This simulates the user being verified but with no org attached
    formatVerifiedNickname.mockReturnValue('[UNKNOWN] VerifiedUser'); // Unknown tag preserved
  
    mockOldMember = createMockMember('user1', 'VerifiedUser', '[UNKNOWN] OldNick');
    mockNewMember = createMockMember('user1', 'VerifiedUser', '[UNKNOWN] WrongNick');
  
    await enforceNicknameFormat(mockOldMember, mockNewMember);
  
    expect(mockNewMember.setNickname).toHaveBeenCalledWith('[UNKNOWN] VerifiedUser');
  });

  it('strips incorrect known tag from verified user', async () => {
    VerifiedUser.findByPk.mockResolvedValue({ discordUserId: 'user1', rsiOrgId: 'PFCS' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFCS' });
    formatVerifiedNickname.mockReturnValue('[PFCS] VerifiedUser');
  
    const oldMember = createMockMember('user1', 'VerifiedUser', '[DEFN] VerifiedUser');
    const newMember = createMockMember('user1', 'VerifiedUser', '[DEFN] VerifiedUser updated'); // Must differ to bypass early return
  
    await enforceNicknameFormat(oldMember, newMember);
  
    expect(newMember.setNickname).toHaveBeenCalledTimes(1);
    expect(newMember.setNickname).toHaveBeenCalledWith('[PFCS] VerifiedUser');
  });
    
  it('adds missing tag for verified user with no tag present', async () => {
    VerifiedUser.findByPk.mockResolvedValue({ discordUserId: 'user1', rsiOrgId: 'PFCS' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFCS' });
    formatVerifiedNickname.mockReturnValue('[PFCS] VerifiedUser');
  
    mockOldMember = createMockMember('user1', 'VerifiedUser', 'OldNick');
    mockNewMember = createMockMember('user1', 'VerifiedUser', 'VerifiedUser'); // No tag at all
  
    await enforceNicknameFormat(mockOldMember, mockNewMember);
  
    expect(mockNewMember.setNickname).toHaveBeenCalledWith('[PFCS] VerifiedUser');
  });
  
  it('strips known tag and adds ⛔ for unverified user', async () => {
    VerifiedUser.findByPk.mockResolvedValue(null); // Unverified
    formatVerifiedNickname.mockReturnValue('UnverifiedUser ⛔');
  
    mockOldMember = createMockMember('user1', 'UnverifiedUser', '[PFCS] UnverifiedUser');
    mockNewMember = createMockMember('user1', 'UnverifiedUser', '[PFCS] UnverifiedUser updated'); // Has known tag but unverified
  
    await enforceNicknameFormat(mockOldMember, mockNewMember);
  
    expect(mockNewMember.setNickname).toHaveBeenCalledWith('UnverifiedUser ⛔');
  });
  
  it('preserves unknown tag and adds ⛔ for unverified user', async () => {
    VerifiedUser.findByPk.mockResolvedValue(null); // Unverified
    formatVerifiedNickname.mockReturnValue('[???] UnverifiedUser ⛔');
  
    mockOldMember = createMockMember('user1', 'UnverifiedUser', '[???] UnverifiedUser');
    mockNewMember = createMockMember('user1', 'UnverifiedUser', '[???] WrongNick');
  
    await enforceNicknameFormat(mockOldMember, mockNewMember);
  
    expect(mockNewMember.setNickname).toHaveBeenCalledWith('[???] UnverifiedUser ⛔');
  });

  it('does not add tag if verified user has no org ID', async () => {
    VerifiedUser.findByPk.mockResolvedValue({ discordUserId: 'user1', rsiOrgId: null }); // Verified but no org
    OrgTag.findByPk.mockResolvedValue(null); // No matching org tag
    formatVerifiedNickname.mockReturnValue('VerifiedUser'); // No tag applied
  
    mockOldMember = createMockMember('user1', 'VerifiedUser', 'OldNick');
    mockNewMember = createMockMember('user1', 'VerifiedUser', 'WrongNick');
  
    await enforceNicknameFormat(mockOldMember, mockNewMember);
  
    expect(mockNewMember.setNickname).toHaveBeenCalledWith('VerifiedUser');
  });
  
});
