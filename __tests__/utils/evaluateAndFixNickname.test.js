const { evaluateAndFixNickname } = require('../../utils/evaluateAndFixNickname');
const { VerifiedUser, OrgTag } = require('../../config/database');
const { pendingVerifications } = require('../../commands/user/verify');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');

jest.mock('../../config/database');
jest.mock('../../utils/formatVerifiedNickname');

beforeEach(() => {
  jest.clearAllMocks();
  pendingVerifications.clear();
});

describe('evaluateAndFixNickname', () => {
  test('returns false for bot members', async () => {
    const member = { user: { bot: true } };
    const result = await evaluateAndFixNickname(member);
    expect(result).toBe(false);
    expect(VerifiedUser.findByPk).not.toHaveBeenCalled();
  });

  test('skips members pending verification when skipPending is true', async () => {
    const member = { id: '123', user: { bot: false } };
    pendingVerifications.add('123');
    const result = await evaluateAndFixNickname(member, { skipPending: true });
    expect(result).toBe(false);
    expect(VerifiedUser.findByPk).not.toHaveBeenCalled();
  });

  test('uses provided verifiedUsersMap', async () => {
    const member = {
      id: '123',
      user: { bot: false, tag: 'User#1', username: 'User' },
      displayName: 'User',
      nickname: 'User',
      setNickname: jest.fn().mockResolvedValue()
    };
    const map = new Map([
      ['123', { manualTagOverride: null }]
    ]);
    formatVerifiedNickname.mockReturnValue('User');
    OrgTag.findAll.mockResolvedValue([]);

    const result = await evaluateAndFixNickname(member, { verifiedUsersMap: map });
    expect(result).toBe(false);
    expect(VerifiedUser.findByPk).not.toHaveBeenCalled();
  });

  test('applies manual tag override', async () => {
    const member = {
      id: '123',
      user: { bot: false, tag: 'User#1', username: 'User' },
      displayName: 'User',
      nickname: 'User',
      setNickname: jest.fn().mockResolvedValue()
    };

    VerifiedUser.findByPk.mockResolvedValue({ manualTagOverride: 'PFC' });
    OrgTag.findAll.mockResolvedValue([{ tag: 'PFC' }]);
    formatVerifiedNickname.mockReturnValue('[PFC] User');

    const updated = await evaluateAndFixNickname(member);
    expect(updated).toBe(true);
    expect(member.setNickname).toHaveBeenCalledWith('[PFC] User');
  });

  test('propagates database errors', async () => {
    const member = {
      id: '123',
      user: { bot: false, tag: 'User#1', username: 'User' },
      displayName: 'User',
      nickname: 'User',
      setNickname: jest.fn()
    };

    VerifiedUser.findByPk.mockRejectedValue(new Error('db fail'));

    await expect(evaluateAndFixNickname(member)).rejects.toThrow('db fail');
  });
});
