jest.mock('../../../botactions/userManagement/permissions', () => ({ isAdmin: jest.fn() }));
jest.mock('../../../utils/apiSync/syncApiData', () => ({ runFullApiSync: jest.fn() }));

const { isAdmin } = require('../../../botactions/userManagement/permissions');
const { runFullApiSync } = require('../../../utils/apiSync/syncApiData');
const { execute } = require('../../../commands/admin/syncapidata');
const { MessageFlags } = require('discord.js');

describe('/syncapidata command', () => {
  const makeInteraction = () => ({
    deferReply: jest.fn(),
    reply: jest.fn(),
    member: {},
  });

  beforeEach(() => jest.clearAllMocks());

  test('blocks non-admin users', async () => {
    isAdmin.mockReturnValue(false);
    const interaction = makeInteraction();
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('permission'),
      flags: MessageFlags.Ephemeral
    });
    expect(runFullApiSync).not.toHaveBeenCalled();
  });

  test('runs full API sync for admins', async () => {
    isAdmin.mockReturnValue(true);
    const interaction = makeInteraction();
    await execute(interaction);
    expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(runFullApiSync).toHaveBeenCalledWith(interaction);
  });
});
