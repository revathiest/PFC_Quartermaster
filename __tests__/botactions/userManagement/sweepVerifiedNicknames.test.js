const { sweepVerifiedNicknames } = require('../../../botactions/userManagement/sweepVerifiedNicknames');
const { VerifiedUser, OrgTag } = require('../../../config/database');
const { formatVerifiedNickname } = require('../../../utils/formatVerifiedNickname');

jest.mock('../../../config/database');
jest.mock('../../../utils/formatVerifiedNickname');

describe('sweepVerifiedNicknames', () => {
  let mockClient, mockGuild, mockMembers;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMembers = new Map();
    const createMockMember = (id, username, nickname = null, isBot = false) => ({
      id,
      nickname,
      user: { id, username, bot: isBot, tag: `${username}#1234` },
      displayName: nickname || username,
      setNickname: jest.fn().mockResolvedValue(true),
    });

    const member1 = createMockMember('user1', 'VerifiedUser', 'WrongName');
    const member2 = createMockMember('user2', 'UnverifiedUser', 'WrongNameToo');
    const botMember = createMockMember('bot1', 'BotUser', null, true);

    mockMembers.set('user1', member1);
    mockMembers.set('user2', member2);
    mockMembers.set('bot1', botMember);

    mockGuild = {
      members: {
        fetch: jest.fn().mockResolvedValue(mockMembers),
      },
    };

    mockClient = {
      guilds: {
        cache: {
          first: () => mockGuild,
        },
      },
    };
  });

  it('updates nicknames correctly based on verification status', async () => {
    VerifiedUser.findAll.mockResolvedValue([
      { discordUserId: 'user1', rsiOrgId: 'PFCS' },
    ]);
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFCS' });

    formatVerifiedNickname.mockImplementation((name, verified, tag) => {
      return verified ? `[${tag}] VerifiedUser` : `${name} ⛔`;
    });

    await sweepVerifiedNicknames(mockClient);

    expect(mockMembers.get('user1').setNickname).toHaveBeenCalledWith('[PFCS] VerifiedUser');
    expect(mockMembers.get('user2').setNickname).toHaveBeenCalledWith('WrongNameToo ⛔');
    expect(mockMembers.get('bot1').setNickname).not.toHaveBeenCalled();
  });

  it('does not update if nickname is already correct', async () => {
    VerifiedUser.findAll.mockResolvedValue([{ discordUserId: 'user1', rsiOrgId: 'PFCS' }]);
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFCS' });

    mockMembers.get('user1').nickname = '[PFCS] VerifiedUser';
    mockMembers.get('user1').displayName = '[PFCS] VerifiedUser';

    formatVerifiedNickname.mockImplementation(() => '[PFCS] VerifiedUser');

    await sweepVerifiedNicknames(mockClient);

    expect(mockMembers.get('user1').setNickname).not.toHaveBeenCalled();
  });

  it('logs a warning if no guild is found', async () => {
    const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const emptyClient = {
      guilds: {
        cache: {
          first: () => undefined,
        },
      },
    };

    await sweepVerifiedNicknames(emptyClient);

    expect(mockConsoleWarn).toHaveBeenCalledWith('[SWEEP] No guild found in cache. Cannot run sweep.');
    mockConsoleWarn.mockRestore();
  });

  it('handles missing org tags gracefully', async () => {
    VerifiedUser.findAll.mockResolvedValue([{ discordUserId: 'user1', rsiOrgId: 'MISSING' }]);
    OrgTag.findByPk.mockResolvedValue(null);

    formatVerifiedNickname.mockImplementation((name, verified) => `${name} formatted`);

    await sweepVerifiedNicknames(mockClient);

    expect(mockMembers.get('user1').setNickname).toHaveBeenCalled();
  });

  it('continues sweeping if setNickname throws an error', async () => {
    VerifiedUser.findAll.mockResolvedValue([{ discordUserId: 'user1', rsiOrgId: 'PFCS' }]);
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFCS' });

    mockMembers.get('user1').setNickname.mockRejectedValue(new Error('Test error'));
    const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    formatVerifiedNickname.mockImplementation(() => '[PFCS] VerifiedUser');

    await sweepVerifiedNicknames(mockClient);

    expect(mockConsoleWarn).toHaveBeenCalledWith('[SWEEP] Could not update VerifiedUser#1234:', 'Test error');
    mockConsoleWarn.mockRestore();
  });

  it('logs the correct summary of checked and updated members', async () => {
    VerifiedUser.findAll.mockResolvedValue([{ discordUserId: 'user1', rsiOrgId: 'PFCS' }]);
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFCS' });

    formatVerifiedNickname.mockImplementation(() => '[PFCS] VerifiedUser');

    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    await sweepVerifiedNicknames(mockClient);

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Checked:'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Updated:'));
    mockConsoleLog.mockRestore();
  });
});
