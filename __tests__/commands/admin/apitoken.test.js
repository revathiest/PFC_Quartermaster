jest.mock('../../../botactions/userManagement/permissions', () => ({ isAdmin: jest.fn() }));
const jwt = require('jsonwebtoken');

const { isAdmin } = require('../../../botactions/userManagement/permissions');
const { execute } = require('../../../commands/admin/apitoken');
const { MessageFlags } = require('discord.js');

describe('/apitoken command', () => {
  const makeInteraction = () => ({
    reply: jest.fn(),
    user: { id: '1', username: 'Tester' },
    member: { displayName: 'Display', roles: { cache: [{ name: 'Admin' }] } },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  test('blocks non-admin users', async () => {
    isAdmin.mockReturnValue(false);
    const interaction = makeInteraction();
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('permission'),
      flags: MessageFlags.Ephemeral
    });
  });

  test('returns a signed token for admins', async () => {
    isAdmin.mockReturnValue(true);
    const interaction = makeInteraction();
    await execute(interaction);
    const [[{ content }]] = interaction.reply.mock.calls;
    const token = content.replace('Bearer ', '');
    expect(jwt.verify(token, 'secret')).toMatchObject({
      id: '1',
      username: 'Tester',
      displayName: 'Display',
      roles: ['Admin']
    });
  });
});
