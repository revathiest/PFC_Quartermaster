jest.mock('../../../config/database', () => require('../../../__mocks__/config/database'));
const { handleReactionAdd, handleReactionRemove } = require('../../../botactions/eventHandling/reactionEvents');
const { UsageLog } = require('../../../config/database');

describe('reactionEvents', () => {
  let reaction, user;
  beforeEach(() => {
    jest.clearAllMocks();
    reaction = {
      message: { id: 'm1', channel: { id: 'c1' }, guild: { id: 's1' } },
      emoji: { name: '👍' }
    };
    user = { id: 'u1', bot: false };
  });

  test('logs reaction add', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await handleReactionAdd(reaction, user);
    expect(UsageLog.create).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'reaction_add', reaction_type: '👍' }));
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  test('logs reaction remove', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await handleReactionRemove(reaction, user);
    expect(UsageLog.create).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'reaction_remove' }));
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  test('handleReactionRemove ignores bot reactions', async () => {
    await handleReactionRemove(reaction, { ...user, bot: true });
    expect(UsageLog.create).not.toHaveBeenCalled();
  });

  test('handleReactionRemove logs error on failure', async () => {
    UsageLog.create.mockRejectedValue(new Error('fail'));
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handleReactionRemove(reaction, user);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  test('ignores bot reactions', async () => {
    await handleReactionAdd(reaction, { ...user, bot: true });
    expect(UsageLog.create).not.toHaveBeenCalled();
  });

  test('logs error on failure', async () => {
    UsageLog.create.mockRejectedValue(new Error('fail'));
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handleReactionAdd(reaction, user);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
