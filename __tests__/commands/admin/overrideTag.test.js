jest.mock('../../../config/database', () => require('../../../__mocks__/config/database'));
jest.mock('../../../utils/evaluateAndFixNickname');

const { data, execute } = require('../../../commands/admin/overrideTag');
const { VerifiedUser, OrgTag } = require('../../../config/database');
const { evaluateAndFixNickname } = require('../../../utils/evaluateAndFixNickname');

describe('/override-tag command', () => {
  let mockInteraction;

  const createMockInteraction = (isAdmin = true, userId = 'user1', selectedTag = 'PFC') => ({
    member: {
      permissions: {
        has: jest.fn(() => isAdmin),
      },
    },
    options: {
      getUser: jest.fn(() => ({ id: userId, username: 'TestUser' })),
      getString: jest.fn(() => selectedTag),
    },
    guild: {
      members: {
        fetch: jest.fn(() => ({
          id: userId,
          nickname: 'TestUser',
          displayName: 'TestUser',
          user: { id: userId, tag: 'TestUser#1234' },
          setNickname: jest.fn(),
        })),
      },
    },
    reply: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    OrgTag.findAll.mockResolvedValue([{ tag: 'PFC' }, { tag: 'DEFN' }]);
  });

  it('rejects if user is not an admin', async () => {
    mockInteraction = createMockInteraction(false);

    await execute(mockInteraction); // ✅ Correct now

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('do not have permission') })
    );
  });

  it('rejects invalid tag', async () => {
    mockInteraction = createMockInteraction(true, 'user1', 'INVALID_TAG');

    await execute(mockInteraction); // ✅ Correct now

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('Invalid tag') })
    );
  });

  it('sets manualTagOverride and updates nickname on valid input', async () => {
    mockInteraction = createMockInteraction(true, 'user1', 'PFC');
  
    VerifiedUser.findOrCreate.mockResolvedValue([{ update: jest.fn(), manualTagOverride: null }, false]);
  
    await execute(mockInteraction);
  
    expect(VerifiedUser.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { discordUserId: 'user1' },
        defaults: expect.objectContaining({
          manualTagOverride: 'PFC',
        }),
      })
    );
    expect(evaluateAndFixNickname).toHaveBeenCalled();
    expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: '✅ Tag override applied: **TestUser** is now set to **[PFC]** and nickname updated.',
        ephemeral: true,
      });
      
  });
  
});
