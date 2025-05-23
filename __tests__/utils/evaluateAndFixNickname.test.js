const { evaluateAndFixNickname } = require('../../utils/evaluateAndFixNickname');
const { VerifiedUser, OrgTag } = require('../../config/database');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');
const { pendingVerifications } = require('../../commands/user/verify');

jest.mock('../../config/database');
jest.mock('../../utils/formatVerifiedNickname');
jest.mock('../../commands/user/verify', () => ({ pendingVerifications: new Set() }));

describe('evaluateAndFixNickname', () => {
  const createMember = (id, username, nickname = null, bot = false) => ({
    id,
    nickname,
    displayName: nickname || username,
    user: { id, username, tag: `${username}#1234`, bot },
    setNickname: jest.fn().mockResolvedValue(true),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    pendingVerifications.clear();
    OrgTag.findAll.mockResolvedValue([{ tag: 'PFC' }]);
  });

  test('returns false for bots', async () => {
    const member = createMember('1', 'Bot', 'Bot', true);
    const result = await evaluateAndFixNickname(member);
    expect(result).toBe(false);
  });

  test('skips pending verifications when option set', async () => {
    pendingVerifications.add('2');
    const member = createMember('2', 'User');
    const result = await evaluateAndFixNickname(member, { skipPending: true });
    expect(result).toBe(false);
    expect(VerifiedUser.findByPk).not.toHaveBeenCalled();
  });

  test('updates nickname for verified user with org tag', async () => {
    const member = createMember('3', 'Tester', 'Tester');
    VerifiedUser.findByPk.mockResolvedValue({ discordUserId: '3', rsiOrgId: 'PFC' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFC' });
    formatVerifiedNickname.mockReturnValue('[PFC] Tester');

    const updated = await evaluateAndFixNickname(member);

    expect(formatVerifiedNickname).toHaveBeenCalledWith('Tester', true, 'PFC');
    expect(member.setNickname).toHaveBeenCalledWith('[PFC] Tester');
    expect(updated).toBe(true);
  });

  test('adds symbol for unverified user', async () => {
    const member = createMember('4', 'Foo', 'Foo');
    VerifiedUser.findByPk.mockResolvedValue(null);
    formatVerifiedNickname.mockReturnValue('Foo ⛔');

    const updated = await evaluateAndFixNickname(member);

    expect(formatVerifiedNickname).toHaveBeenCalledWith('Foo', false, null);
    expect(member.setNickname).toHaveBeenCalledWith('Foo ⛔');
    expect(updated).toBe(true);
  });
});
