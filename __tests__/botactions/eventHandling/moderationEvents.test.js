const { handleGuildMemberRemove, handleGuildBanAdd, handleGuildMemberUpdate } = require('../../../botactions/eventHandling/moderationEvents');
const { UsageLog } = require('../../../config/database');

jest.mock('../../../config/database', () => ({
  UsageLog: { create: jest.fn() }
}));

describe('moderationEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGuildMemberRemove', () => {
    test('logs kick when audit entry matches', async () => {
      const log = jest.spyOn(console, 'log').mockImplementation(() => {});
      const guild = {
        id: 's1',
        fetchAuditLogs: jest.fn().mockResolvedValue({
          entries: { first: () => ({ target: { id: 'u1' }, createdTimestamp: Date.now() }) }
        })
      };
      const member = { id: 'u1', guild };
      await handleGuildMemberRemove(member);
      expect(UsageLog.create).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'kick', user_id: 'u1', server_id: 's1' }));
      log.mockRestore();
    });

    test('does not log when audit entry differs', async () => {
      const guild = {
        id: 's1',
        fetchAuditLogs: jest.fn().mockResolvedValue({
          entries: { first: () => ({ target: { id: 'u2' }, createdTimestamp: Date.now() }) }
        })
      };
      const member = { id: 'u1', guild };
      await handleGuildMemberRemove(member);
      expect(UsageLog.create).not.toHaveBeenCalled();
    });
  });

  test('handleGuildBanAdd logs ban', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const ban = { user: { id: 'u1' }, guild: { id: 's1' } };
    await handleGuildBanAdd(ban);
    expect(UsageLog.create).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'ban', user_id: 'u1', server_id: 's1' }));
    log.mockRestore();
  });

  test('handleGuildMemberUpdate logs timeout start and end', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const guild = { id: 's1' };
    const oldMember = { id: 'u1', guild, communicationDisabledUntil: null };
    const newMember = { id: 'u1', guild, communicationDisabledUntil: new Date(Date.now() + 1000) };
    await handleGuildMemberUpdate(oldMember, newMember);
    expect(UsageLog.create).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'timeout_start' }));
    UsageLog.create.mockClear();
    await handleGuildMemberUpdate(newMember, { ...oldMember, communicationDisabledUntil: null });
    expect(UsageLog.create).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'timeout_end' }));
    log.mockRestore();
  });
});
