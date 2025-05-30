jest.mock('../../../config/database', () => require('../../../__mocks__/config/database'));
jest.mock('../../../utils/formatVerifiedNickname');

const { handleMemberJoin } = require('../../../botactions/eventHandling/memberJoinEvent');
const { VerifiedUser, OrgTag } = require('../../../config/database');
const { formatVerifiedNickname } = require('../../../utils/formatVerifiedNickname');

describe('handleMemberJoin', () => {
  let member;
  beforeEach(() => {
    jest.clearAllMocks();
    member = {
      id: 'user1',
      displayName: 'Display',
      nickname: 'Display',
      user: { bot: false, tag: 'User#1234' },
      setNickname: jest.fn().mockResolvedValue(true)
    };
  });

  test('ignores bot users', async () => {
    member.user.bot = true;
    await handleMemberJoin(member);
    expect(VerifiedUser.findByPk).not.toHaveBeenCalled();
  });

  test('sets nickname when not matching expected', async () => {
    VerifiedUser.findByPk.mockResolvedValue({ rsiOrgId: 'PFCS' });
    OrgTag.findByPk.mockResolvedValue({ tag: 'PFC' });
    formatVerifiedNickname.mockReturnValue('[PFC] Display');

    await handleMemberJoin(member);

    expect(VerifiedUser.findByPk).toHaveBeenCalledWith('user1');
    expect(OrgTag.findByPk).toHaveBeenCalledWith('PFCS');
    expect(formatVerifiedNickname).toHaveBeenCalledWith('Display', true, 'PFC');
    expect(member.setNickname).toHaveBeenCalledWith('[PFC] Display');
  });

  test('uses unverified nickname when user not found', async () => {
    VerifiedUser.findByPk.mockResolvedValue(null);
    formatVerifiedNickname.mockReturnValue('Display ⛔');

    await handleMemberJoin(member);
    expect(formatVerifiedNickname).toHaveBeenCalledWith('Display', false, null);
    expect(member.setNickname).toHaveBeenCalledWith('Display ⛔');
  });

  test('warns when nickname update fails', async () => {
    VerifiedUser.findByPk.mockRejectedValue(new Error('fail'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await handleMemberJoin(member);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
