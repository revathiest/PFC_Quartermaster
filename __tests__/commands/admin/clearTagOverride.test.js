const { data, execute } = require('../../../commands/admin/clearTagOverride');
const { VerifiedUser } = require('../../../config/database');
const { evaluateAndFixNickname } = require('../../../utils/evaluateAndFixNickname');

jest.mock('../../../config/database');
jest.mock('../../../utils/evaluateAndFixNickname');

describe('/clear-tag-override command', () => {
  let mockInteraction;

  const createMockInteraction = ({ isAdmin = true } = {}) => ({
    member: {
      permissions: {
        has: jest.fn(() => isAdmin),
      },
    },
    options: {
      getUser: jest.fn(() => ({
        id: 'user1',
        username: 'TestUser',
      })),
    },
    guild: {
      members: {
        fetch: jest.fn(() => ({
          id: 'user1',
          displayName: 'TestUser',
          nickname: 'TestUser',
          user: { id: 'user1', username: 'TestUser', tag: 'TestUser#1234' },
          setNickname: jest.fn(),
        })),
      },
    },
    reply: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('properly defines the slash command with correct name and options', () => {
    expect(data.name).toBe('clear-tag-override');
    expect(data.description).toBe('Remove a manual tag override for a user.');
    expect(data.options.length).toBe(1);

    const userOption = data.options[0];
    expect(userOption.name).toBe('user');
    expect(userOption.required).toBe(true);
  });

  it('rejects if user is not an admin', async () => {
    mockInteraction = createMockInteraction({ isAdmin: false });

    await execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('do not have permission'),
        ephemeral: true,
      })
    );
  });

  it('rejects if no VerifiedUser record found', async () => {
    mockInteraction = createMockInteraction();
    VerifiedUser.findByPk.mockResolvedValue(null);

    await execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('No manual override'),
        ephemeral: true,
      })
    );
  });

  it('rejects if VerifiedUser exists but no manual override set', async () => {
    mockInteraction = createMockInteraction();
    VerifiedUser.findByPk.mockResolvedValue({
      manualTagOverride: null,
      update: jest.fn(),
    });

    await execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('No manual override'),
        ephemeral: true,
      })
    );
  });

  it('successfully clears manualTagOverride and updates nickname', async () => {
    const updateMock = jest.fn();
    mockInteraction = createMockInteraction();
    
    VerifiedUser.findByPk.mockResolvedValue({
      manualTagOverride: 'PFC',
      update: updateMock,
    });

    await execute(mockInteraction);

    expect(updateMock).toHaveBeenCalledWith({ manualTagOverride: null });
    expect(evaluateAndFixNickname).toHaveBeenCalled();
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Tag override cleared'),
        ephemeral: true,
      })
    );
  });
});
