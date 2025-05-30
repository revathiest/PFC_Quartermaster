jest.mock('../../../config/database', () => require('../../../__mocks__/config/database'));
jest.mock('../../../utils/rsiScrapeOrgMembers');
jest.mock('../../../utils/getGuildMembersWithRoles');

const { execute } = require('../../../commands/admin/orgstatus');
const { VerifiedUser } = require('../../../config/database');
const rsiScrapeOrgMembers = require('../../../utils/rsiScrapeOrgMembers');
const getGuildMembersWithRoles = require('../../../utils/getGuildMembersWithRoles');

const makeInteraction = () => ({
  guild: { memberCount: 5 },
  deferReply: jest.fn(),
  editReply: jest.fn(),
  guildId: 'guild1',
  guild: {
    id: 'guild1',
    memberCount: 5
  }
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('/orgstatus report', () => {
  test('generates report embed', async () => {
    const interaction = makeInteraction();
    rsiScrapeOrgMembers.mockResolvedValue({ members: [{ handle: 'A' }], redactedCount: 1 });
    VerifiedUser.findAll.mockResolvedValue([
      { rsiOrgId: 'PFCS', rsiHandle: 'A', discordUserId: 'd1' },
      { rsiOrgId: 'OTHER', rsiHandle: 'B', discordUserId: 'd2' }
    ]);
    getGuildMembersWithRoles.mockResolvedValue([{ id: 'd1' }]);

    await execute(interaction);

    expect(rsiScrapeOrgMembers).toHaveBeenCalled();
    expect(getGuildMembersWithRoles).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
  });
});
